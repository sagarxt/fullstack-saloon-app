package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.booking.*;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.security.CustomUserDetails;
import com.loyalty_program_app.backend.service.customer.CustomerBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/bookings")
@RequiredArgsConstructor
public class CustomerBookingController {

    private final CustomerBookingService bookingService;

    @PostMapping()
    public BookingResponse createBooking(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody CustomerCreateBookingRequest request
    ) {
        return bookingService.createBooking(user.getId(), request);
    }

    @GetMapping()
    public List<BookingResponse> getMyBookings(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return bookingService.getMyBookings(user.getId());
    }

    @GetMapping("/{id}")
    public BookingDetailsResponse getBookingById(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id
    ) {
        return bookingService.getMyBookingById(user.getId(), id);
    }

    @PostMapping("/preview")
    public BookingPreviewResponse previewBooking(
            @RequestBody BookingPreviewRequest request
    ) {
        return bookingService.previewBooking(request);
    }

    @GetMapping("/slots")
    public SlotAvailabilityResponse getUnavailableSlots(
            @RequestParam LocalDate date,
            @RequestParam UUID serviceId
    ) {
        return bookingService.getUnavailableSlots(date, serviceId);
    }

    @PutMapping("/{id}/reschedule")
    public BookingResponse rescheduleBooking(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id,
            @RequestBody RescheduleBookingRequest request
    ) {
        return bookingService.rescheduleBooking(user.getId(), id, request);
    }

    @PutMapping("/{id}/cancel")
    public BookingResponse cancelBooking(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id
    ) {
        return bookingService.cancelBooking(user.getId(), id);
    }
}
