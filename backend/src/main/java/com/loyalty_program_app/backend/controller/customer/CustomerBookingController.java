package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.booking.CustomerCreateBookingRequest;
import com.loyalty_program_app.backend.dto.booking.CustomerUpdateBookingRequest;
import com.loyalty_program_app.backend.service.interfaces.CustomerBookingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/bookings")
@RequiredArgsConstructor
public class CustomerBookingController {

    private final CustomerBookingService bookingService;

    private UUID getCurrentUserId(HttpServletRequest request) {
        return UUID.fromString((String) request.getAttribute("userId"));
    }

    @PostMapping
    public BookingResponse createBooking(
            HttpServletRequest request,
            @RequestBody CustomerCreateBookingRequest bookingRequest
    ) {
        return bookingService.createBooking(getCurrentUserId(request), bookingRequest);
    }

    @GetMapping
    public Page<BookingResponse> listMyBookings(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return bookingService.listMyBookings(getCurrentUserId(request), pageable);
    }

    @GetMapping("/{id}")
    public BookingResponse getMyBooking(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        return bookingService.getMyBooking(getCurrentUserId(request), id);
    }

    @PutMapping("/{id}")
    public BookingResponse updateMyBooking(
            HttpServletRequest request,
            @PathVariable UUID id,
            @RequestBody CustomerUpdateBookingRequest updateRequest
    ) {
        return bookingService.updateMyBooking(getCurrentUserId(request), id, updateRequest);
    }

    @PostMapping("/{id}/cancel")
    public BookingResponse cancelMyBooking(
            HttpServletRequest request,
            @PathVariable UUID id,
            @RequestParam(required = false) String note
    ) {
        return bookingService.cancelMyBooking(getCurrentUserId(request), id, note);
    }
}
