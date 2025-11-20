package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.booking.BookingRequest;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminBookingServiceImpl {

    private final BookingRepository bookingRepo;

    // GET ALL BOOKINGS
    public List<BookingResponse> getAllBookings() {
        return bookingRepo.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET ONE
    public BookingResponse getBooking(UUID id) {
        Booking booking = bookingRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return toResponse(booking);
    }

    // UPDATE ALL FIELDS (except status)
    public BookingResponse updateBooking(UUID id, BookingRequest req) {
        Booking b = bookingRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        b.setUserId(req.getUserId());
        b.setServiceId(req.getServiceId());
        b.setScheduledAt(req.getScheduledAt());
        b.setPricePaid(req.getPricePaid());
        b.setNote(req.getNote());
        b.setPaymentGatewayId(req.getPaymentGatewayId());

        bookingRepo.save(b);
        return toResponse(b);
    }

    // UPDATE STATUS ONLY
    public BookingResponse updateStatus(UUID id, BookingStatus status) {
        Booking booking = bookingRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(status);
        bookingRepo.save(booking);

        return toResponse(booking);
    }

    // DELETE
    public void deleteBooking(UUID id) {
        if (!bookingRepo.existsById(id)) {
            throw new RuntimeException("Booking not found");
        }
        bookingRepo.deleteById(id);
    }

    // MAP ENTITY → DTO
    private BookingResponse toResponse(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .userId(b.getUserId())
                .serviceId(b.getServiceId())
                .scheduledAt(b.getScheduledAt())
                .pricePaid(b.getPricePaid())
                .status(b.getStatus())
                .note(b.getNote())
                .paymentGatewayId(b.getPaymentGatewayId())
                .createdAt(b.getCreatedAt())
                .build();
    }

    public List<BookingResponse> searchBookings(String keyword) {
        List<Booking> list;

        if (keyword == null || keyword.trim().isEmpty()) {
            list = bookingRepo.findAll();
        } else {
            keyword = "%" + keyword.toLowerCase() + "%";
            list = bookingRepo.search(keyword);
        }

        return list.stream().map(this::toResponse).toList();
    }

    public List<BookingResponse> filterBookings(String keyword, String status, String fromDate, String toDate) {

        List<Booking> all = bookingRepo.findAll();

        return all.stream()
                .filter(b -> keyword == null || keyword.isBlank()
                        || (b.getNote() != null && b.getNote().toLowerCase().contains(keyword.toLowerCase()))
                        || b.getUserId().toString().contains(keyword)
                        || b.getServiceId().toString().contains(keyword)
                )
                .filter(b -> status == null || status.isBlank() || b.getStatus().name().equals(status))
                .filter(b -> {
                    if (fromDate == null || toDate == null) return true;

                    var start = OffsetDateTime.parse(fromDate);
                    var end = OffsetDateTime.parse(toDate);

                    return b.getScheduledAt().isAfter(start) && b.getScheduledAt().isBefore(end);
                })
                .map(this::toResponse)
                .toList();
    }

}
