package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.booking.BookingRequest;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.service.impl.AdminBookingServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/bookings")
@RequiredArgsConstructor
public class AdminBookingController {

    private final AdminBookingServiceImpl bookingService;

    // -----------------------------
    // GET ALL BOOKINGS
    // -----------------------------
    @GetMapping
    public List<BookingResponse> getAll() {
        return bookingService.getAllBookings();
    }

    // -----------------------------
    // KEYWORD SEARCH ONLY
    // -----------------------------
    @GetMapping("/search")
    public List<BookingResponse> searchBookings(
            @RequestParam(required = false) String keyword
    ) {
        return bookingService.searchBookings(keyword);
    }

    // -----------------------------
    // ADVANCED FILTERING
    // -----------------------------
    @GetMapping("/filter")
    public List<BookingResponse> filterBookings(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate
    ) {
        return bookingService.filterBookings(keyword, status, fromDate, toDate);
    }

    // -----------------------------
    // GET SINGLE BOOKING
    // -----------------------------
    @GetMapping("/{id}")
    public BookingResponse getById(@PathVariable UUID id) {
        return bookingService.getBooking(id);
    }

    // -----------------------------
    // UPDATE BOOKING DETAILS
    // -----------------------------
    @PutMapping("/{id}")
    public BookingResponse update(
            @PathVariable UUID id,
            @RequestBody BookingRequest req
    ) {
        return bookingService.updateBooking(id, req);
    }

    // -----------------------------
    // UPDATE STATUS ONLY
    // -----------------------------
    @PutMapping("/{id}/status")
    public BookingResponse updateStatus(
            @PathVariable UUID id,
            @RequestParam BookingStatus status
    ) {
        return bookingService.updateStatus(id, status);
    }

    // -----------------------------
    // DELETE BOOKING
    // -----------------------------
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        bookingService.deleteBooking(id);
    }

}
