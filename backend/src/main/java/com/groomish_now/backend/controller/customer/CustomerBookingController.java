package com.groomish_now.backend.controller.customer;

import com.groomish_now.backend.dto.booking.*;
import com.groomish_now.backend.dto.payment.RefundDetailResponse;
import com.groomish_now.backend.security.CustomUserDetails;
import com.groomish_now.backend.service.customer.CustomerBookingService;
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
            @PathVariable String id
    ) {
        return bookingService.getMyBookingByIdOrCode(user.getId(), id);
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
            @RequestParam(required = false) UUID serviceId
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

    @PostMapping("/{id}/services/{serviceId}")
    public BookingDetailsResponse addServiceToBooking(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id,
            @PathVariable UUID serviceId,
            @RequestParam(required = false) String subServiceName
    ) {
        return bookingService.addServiceToBooking(user.getId(), id, serviceId, subServiceName);
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public BookingDetailsResponse removeServiceFromBooking(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id,
            @PathVariable UUID itemId
    ) {
        return bookingService.removeServiceFromBooking(user.getId(), id, itemId);
    }

    @GetMapping("/{id}/refund-status")
    public RefundDetailResponse getBookingRefundStatus(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id
    ) {
        return bookingService.getBookingRefundStatus(user.getId(), id);
    }
}
