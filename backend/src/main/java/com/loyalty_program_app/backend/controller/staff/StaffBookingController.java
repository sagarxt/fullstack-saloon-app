package com.loyalty_program_app.backend.controller.staff;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.booking.CustomerUpdateBookingRequest;
import com.loyalty_program_app.backend.dto.staff.StaffCreateBookingRequest;
import com.loyalty_program_app.backend.service.staff.StaffBookingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/bookings")
@RequiredArgsConstructor
public class StaffBookingController {

    private final StaffBookingService staffBookingService;

    private UUID getCurrentStaffId(HttpServletRequest request) {
        return UUID.fromString((String) request.getAttribute("userId"));
    }

    @PostMapping
    public BookingResponse createBookingForCustomer(
            HttpServletRequest request,
            @RequestBody StaffCreateBookingRequest createRequest
    ) {
        return staffBookingService.createBookingForCustomer(getCurrentStaffId(request), createRequest);
    }

    @PutMapping("/{id}")
    public BookingResponse updateBookingForCustomer(
            HttpServletRequest request,
            @PathVariable UUID id,
            @RequestBody CustomerUpdateBookingRequest updateRequest
    ) {
        return staffBookingService.updateBookingForCustomer(getCurrentStaffId(request), id, updateRequest);
    }

    @PostMapping("/{id}/cancel")
    public BookingResponse cancelBookingForCustomer(
            HttpServletRequest request,
            @PathVariable UUID id,
            @RequestParam(required = false) String note
    ) {
        return staffBookingService.cancelBookingForCustomer(getCurrentStaffId(request), id, note);
    }

    @PostMapping("/{id}/confirm")
    public BookingResponse confirmBookingForCustomer(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        return staffBookingService.confirmBookingForCustomer(getCurrentStaffId(request), id);
    }

    @GetMapping("/customer/{customerId}")
    public Page<BookingResponse> getCustomerBookings(
            @PathVariable UUID customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return staffBookingService.getCustomerBookings(customerId, pageable);
    }

    @GetMapping("/{id}")
    public BookingResponse getBooking(@PathVariable UUID id) {
        return staffBookingService.getBooking(id);
    }

    @PostMapping("/{id}/services/{serviceId}")
    public BookingResponse addServiceToBooking(
            HttpServletRequest request,
            @PathVariable UUID id,
            @PathVariable UUID serviceId
    ) {
        return staffBookingService.addServiceToBooking(getCurrentStaffId(request), id, serviceId);
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public BookingResponse removeServiceFromBooking(
            HttpServletRequest request,
            @PathVariable UUID id,
            @PathVariable UUID itemId
    ) {
        return staffBookingService.removeServiceFromBooking(getCurrentStaffId(request), id, itemId);
    }
}
