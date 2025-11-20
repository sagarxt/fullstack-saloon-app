package com.loyalty_program_app.backend.service.impl;

// package com.loyalty_program_app.backend.service.impl;
import com.loyalty_program_app.backend.dto.booking.BookingCreateRequest;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.ServiceEntity;
import com.loyalty_program_app.backend.repository.BookingRepository;
import com.loyalty_program_app.backend.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerBookingServiceImpl {

    private final BookingRepository bookingRepo;
    private final ServiceRepository serviceRepo;

    public BookingResponse createBooking(UUID userId, BookingCreateRequest req) {
        // validate service exists
        ServiceEntity svc = serviceRepo.findById(req.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        // convert LocalDateTime to OffsetDateTime using system zone
        OffsetDateTime scheduled = null;
        LocalDateTime ldt = req.getScheduledAt();
        if (ldt != null) {
            scheduled = ldt.atZone(ZoneId.systemDefault()).toOffsetDateTime();
        }

        Booking b = Booking.builder()
                .userId(userId)
                .serviceId(svc.getId())
                .scheduledAt(scheduled)
                .pricePaid(svc.getPrice() != null ? svc.getPrice() : svc.getMrp())
                .status(BookingStatus.PENDING)
                .note(req.getNote())
                .build();

        bookingRepo.save(b);
        return toResponse(b);
    }

    public List<BookingResponse> getBookingsForUser(UUID userId) {
        return bookingRepo.findByUserIdOrderByScheduledAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BookingResponse getBookingForUser(UUID userId, UUID bookingId) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!b.getUserId().equals(userId)) throw new RuntimeException("Unauthorized");
        return toResponse(b);
    }

    public void cancelBooking(UUID userId, UUID bookingId) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!b.getUserId().equals(userId)) throw new RuntimeException("Unauthorized");
        // either delete or set status CANCELLED
        b.setStatus(BookingStatus.CANCELLED);
        bookingRepo.save(b);
    }

    private BookingResponse toResponse(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .userId(b.getUserId())
                .serviceId(b.getServiceId())
                .scheduledAt(b.getScheduledAt())
                .pricePaid(b.getPricePaid())
                .status(b.getStatus())
                .note(b.getNote())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
