package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.booking.BookingTimelineResponse;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.BookingTimeline;
import com.loyalty_program_app.backend.repository.BookingRepository;
import com.loyalty_program_app.backend.repository.BookingTimelineRepository;
import com.loyalty_program_app.backend.service.BookingTimelineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingTimelineServiceImpl implements BookingTimelineService {

    private final BookingTimelineRepository bookingTimelineRepository;
    private final BookingRepository bookingRepository;

    @Override
    @Transactional
    public BookingTimeline recordTimeline(
            Booking booking,
            String action,
            String title,
            String description,
            String performedBy,
            String role,
            String email
    ) {
        if (booking == null) {
            log.warn("Cannot record timeline for null booking");
            return null;
        }

        BookingTimeline timeline = BookingTimeline.builder()
                .booking(booking)
                .action(action != null ? action : "MODIFIED")
                .title(title != null ? title : "Booking Updated")
                .description(description)
                .performedBy(performedBy != null && !performedBy.isBlank() ? performedBy : "System")
                .performedByRole(role != null && !role.isBlank() ? role : "SYSTEM")
                .performedByEmail(email)
                .createdAt(LocalDateTime.now())
                .build();

        return bookingTimelineRepository.save(timeline);
    }

    @Override
    @Transactional
    public BookingTimeline recordTimeline(
            UUID bookingId,
            String action,
            String title,
            String description,
            String performedBy,
            String role,
            String email
    ) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            log.warn("Cannot record timeline for nonexistent booking id: {}", bookingId);
            return null;
        }
        return recordTimeline(booking, action, title, description, performedBy, role, email);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingTimelineResponse> getTimelineForBooking(Booking booking) {
        if (booking == null) {
            return new ArrayList<>();
        }

        List<BookingTimelineResponse> results = new ArrayList<>();
        List<BookingTimeline> persisted = bookingTimelineRepository.findByBookingIdOrderByCreatedAtAsc(booking.getId());

        boolean hasCreatedEvent = persisted != null && persisted.stream().anyMatch(e -> "CREATED".equalsIgnoreCase(e.getAction()));

        String serviceName = (booking.getBookingItems() != null && !booking.getBookingItems().isEmpty())
                ? booking.getBookingItems().get(0).getServiceNameSnapshot() : "Salon Service";
        String storeName = booking.getStoreNameSnapshot() != null ? booking.getStoreNameSnapshot()
                : (booking.getStore() != null ? booking.getStore().getName() : "Groomish Branch");

        String creatorName = booking.getBookedBy() != null ? booking.getBookedBy()
                : (booking.getUser() != null ? booking.getUser().getName() : "Customer");
        String creatorRole = (booking.getBookedBy() != null && booking.getBookedBy().toUpperCase().contains("STAFF")) ? "STAFF"
                : ((booking.getBookedBy() != null && booking.getBookedBy().toUpperCase().contains("ADMIN")) ? "ADMIN" : "CUSTOMER");
        String creatorEmail = booking.getUser() != null ? booking.getUser().getEmail() : null;

        LocalDateTime createdDate = booking.getCreatedAt() != null ? booking.getCreatedAt()
                : (booking.getScheduledAt() != null ? booking.getScheduledAt().minusDays(1) : LocalDateTime.now().minusDays(1));

        if (!hasCreatedEvent) {
            results.add(BookingTimelineResponse.builder()
                    .id(UUID.randomUUID())
                    .action("CREATED")
                    .title("Appointment Booked")
                    .description("Appointment scheduled for " + serviceName + " at " + storeName + ".")
                    .performedBy(creatorName)
                    .performedByRole(creatorRole)
                    .performedByEmail(creatorEmail)
                    .createdAt(createdDate)
                    .build());
        }

        if (persisted != null && !persisted.isEmpty()) {
            results.addAll(persisted.stream().map(this::toResponse).collect(Collectors.toList()));
            return results;
        }

        if (booking.getStatus() == BookingStatus.MODIFIED ||
                (booking.getBookedBy() != null && booking.getBookedBy().contains("MODIFIED_BY"))) {
            results.add(BookingTimelineResponse.builder()
                    .id(UUID.randomUUID())
                    .action("MODIFIED")
                    .title("Appointment Modified by Stylist")
                    .description("Stylist updated appointment details and service specifications.")
                    .performedBy(booking.getBookedBy() != null ? booking.getBookedBy() : "Stylist")
                    .performedByRole("STAFF")
                    .performedByEmail(null)
                    .createdAt(createdDate.plusMinutes(15))
                    .build());
        }

        if (booking.getBookingProducts() != null && !booking.getBookingProducts().isEmpty()) {
            results.add(BookingTimelineResponse.builder()
                    .id(UUID.randomUUID())
                    .action("PRODUCT_ADDED")
                    .title("Retail Store Products Added")
                    .description(booking.getBookingProducts().size() + " retail store products attached to appointment invoice.")
                    .performedBy(booking.getBookedBy() != null ? booking.getBookedBy() : "Staff Desk")
                    .performedByRole("STAFF")
                    .performedByEmail(null)
                    .createdAt(createdDate.plusMinutes(25))
                    .build());
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            results.add(BookingTimelineResponse.builder()
                    .id(UUID.randomUUID())
                    .action("COMPLETED")
                    .title("Treatment Completed & Billed")
                    .description("Treatment successfully completed. Official itemized tax invoice dispatched.")
                    .performedBy(booking.getBookedBy() != null ? booking.getBookedBy() : "Stylist")
                    .performedByRole("STAFF")
                    .performedByEmail(null)
                    .createdAt(booking.getCompletedAt() != null ? booking.getCompletedAt() : createdDate.plusHours(1))
                    .build());
        } else if (booking.getStatus() == BookingStatus.CANCELLED) {
            boolean isAuto = Boolean.TRUE.equals(booking.getAutoCancelled());
            results.add(BookingTimelineResponse.builder()
                    .id(UUID.randomUUID())
                    .action("CANCELLED")
                    .title(isAuto ? "Auto-Cancelled by System" : "Appointment Cancelled")
                    .description(booking.getNote() != null && !booking.getNote().isBlank()
                            ? "Cancellation note: " + booking.getNote()
                            : (isAuto ? "Client did not attend or reschedule within 2-hour window." : "Appointment cancelled."))
                    .performedBy(isAuto ? "System Scheduler" : (booking.getBookedBy() != null ? booking.getBookedBy() : "Client"))
                    .performedByRole(isAuto ? "SYSTEM" : "STAFF")
                    .performedByEmail(null)
                    .createdAt(booking.getCancelledAt() != null ? booking.getCancelledAt() : createdDate.plusHours(2))
                    .build());
        }

        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingTimelineResponse> getTimelineForBookingId(UUID bookingId) {
        Booking b = bookingRepository.findById(bookingId).orElse(null);
        return getTimelineForBooking(b);
    }

    private BookingTimelineResponse toResponse(BookingTimeline bt) {
        return BookingTimelineResponse.builder()
                .id(bt.getId())
                .action(bt.getAction())
                .title(bt.getTitle())
                .description(bt.getDescription())
                .performedBy(bt.getPerformedBy())
                .performedByRole(bt.getPerformedByRole())
                .performedByEmail(bt.getPerformedByEmail())
                .createdAt(bt.getCreatedAt())
                .build();
    }
}
