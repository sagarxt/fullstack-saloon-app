package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.booking.BookingItemResponse;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.booking.BookingUpdateRequest;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.BookingItem;
import com.loyalty_program_app.backend.repository.BookingRepository;
import com.loyalty_program_app.backend.service.admin.BookingAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingAdminServiceImpl implements BookingAdminService {

    private final BookingRepository bookingRepository;

    // ===================== ADVANCED SEARCH =====================
    @Override
    public Page<BookingResponse> searchBookings(
            String bookingId,
            String customerName,
            String customerEmail,
            String status,
            String fromDate,
            String toDate,
            Pageable pageable
    ) {
        Specification<Booking> spec = Specification.where(null);

        if (bookingId != null && !bookingId.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("id").as(String.class), bookingId));
        }

        if (customerName != null && !customerName.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("user").get("name")),
                            "%" + customerName.toLowerCase() + "%"));
        }

        if (customerEmail != null && !customerEmail.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("user").get("email")),
                            "%" + customerEmail.toLowerCase() + "%"));
        }

        if (status != null && !status.isBlank()) {
            BookingStatus bookingStatus = BookingStatus.valueOf(status);
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), bookingStatus));
        }

        if (fromDate != null && !fromDate.isBlank()) {
            LocalDateTime from = parseDate(fromDate).atStartOfDay();
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("scheduledAt"), from));
        }

        if (toDate != null && !toDate.isBlank()) {
            LocalDateTime to = parseDate(toDate).atTime(23, 59, 59);
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("scheduledAt"), to));
        }

        return bookingRepository.findAll(spec, pageable)
                .map(this::toBookingResponse);
    }

    // ===================== GET SINGLE BOOKING =====================
    @Override
    public BookingResponse getBookingById(UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return toBookingResponse(booking);
    }

    // ===================== UPDATE BOOKING =====================
    @Override
    public BookingResponse updateBooking(UUID id, BookingUpdateRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (request.getScheduledAt() != null) {
            try {
                LocalDateTime newTime = LocalDateTime.parse(request.getScheduledAt());
                booking.setScheduledAt(newTime);
            } catch (DateTimeParseException e) {
                throw new RuntimeException("Invalid scheduledAt format. Use ISO format: 2025-01-20T15:30:00");
            }
        }

        if (request.getStatus() != null) {
            BookingStatus newStatus = BookingStatus.valueOf(request.getStatus());
            booking.setStatus(newStatus);

            if (newStatus == BookingStatus.CANCELLED) {
                booking.setCancelledAt(LocalDateTime.now());
            }
            if (newStatus == BookingStatus.COMPLETED) {
                booking.setCompletedAt(LocalDateTime.now());
            }
        }

        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        if (request.getTotalAmount() != null) {
            booking.setTotalAmount(request.getTotalAmount());
        }

        if (request.getPricePaid() != null) {
            booking.setPricePaid(request.getPricePaid());
        }

        bookingRepository.save(booking);
        return toBookingResponse(booking);
    }

    // ===================== CANCEL BOOKING =====================
    @Override
    public BookingResponse cancelBooking(UUID id, String note) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());

        if (note != null && !note.isBlank()) {
            booking.setNote(note);
        }

        bookingRepository.save(booking);
        return toBookingResponse(booking);
    }

    // ===================== UTIL METHODS =====================
    private LocalDate parseDate(String dateStr) {
        try {
            // Expecting: 2025-01-20
            return LocalDate.parse(dateStr);
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format. Use yyyy-MM-dd");
        }
    }

    private BookingResponse toBookingResponse(Booking b) {
        BookingResponse dto = new BookingResponse();
        dto.setId(b.getId());
        dto.setUserId(b.getUser().getId());
        dto.setUserName(b.getUser().getName());
        dto.setPaymentId(b.getPayment() != null ? b.getPayment().getId() : null);
        dto.setCouponId(b.getCoupon() != null ? b.getCoupon().getId() : null);
        dto.setTotalAmount(b.getTotalAmount());
        dto.setPricePaid(b.getPricePaid());
        dto.setStatus(b.getStatus().name());
        dto.setScheduledAt(b.getScheduledAt() != null ? b.getScheduledAt().toString() : null);
        dto.setNote(b.getNote());
        dto.setBookedBy(b.getBookedBy());

        if (b.getBookingItems() != null) {
            dto.setItems(
                    b.getBookingItems().stream()
                            .map(this::toBookingItemResponse)
                            .collect(Collectors.toList())
            );
        }

        return dto;
    }

    private BookingItemResponse toBookingItemResponse(BookingItem item) {
        BookingItemResponse dto = new BookingItemResponse();
        dto.setId(item.getId());
        dto.setServiceId(item.getService().getId());
        dto.setServiceName(item.getServiceNameSnapshot());
        dto.setServicePrice(item.getServicePriceSnapshot());
        dto.setDuration(item.getServiceDurationSnapshot());
        dto.setStatus(item.getStatus().name());
        return dto;
    }
}
