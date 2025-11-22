package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.booking.BookingUpdateRequest;
import com.loyalty_program_app.backend.service.admin.BookingAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/bookings")
@RequiredArgsConstructor
public class BookingAdminController {

    private final BookingAdminService bookingAdminService;

    // ========== ADVANCED SEARCH ==========
    @GetMapping
    public Page<BookingResponse> searchBookings(
            @RequestParam(required = false) String bookingId,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) String customerEmail,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String fromDate, // yyyy-MM-dd
            @RequestParam(required = false) String toDate,   // yyyy-MM-dd
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return bookingAdminService.searchBookings(
                bookingId, customerName, customerEmail, status, fromDate, toDate, pageable
        );
    }

    // ========== GET ONE BOOKING ==========
    @GetMapping("/{id}")
    public BookingResponse getBooking(@PathVariable UUID id) {
        return bookingAdminService.getBookingById(id);
    }

    // ========== UPDATE BOOKING ==========
    @PutMapping("/{id}")
    public BookingResponse updateBooking(
            @PathVariable UUID id,
            @RequestBody BookingUpdateRequest request
    ) {
        return bookingAdminService.updateBooking(id, request);
    }

    // ========== CANCEL BOOKING ==========
    @PostMapping("/{id}/cancel")
    public BookingResponse cancelBooking(
            @PathVariable UUID id,
            @RequestParam(required = false) String note
    ) {
        return bookingAdminService.cancelBooking(id, note);
    }
}
