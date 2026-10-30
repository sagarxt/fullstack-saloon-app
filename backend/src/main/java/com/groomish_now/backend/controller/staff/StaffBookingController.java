package com.groomish_now.backend.controller.staff;

import com.groomish_now.backend.dto.booking.BookingResponse;
import com.groomish_now.backend.dto.booking.CustomerUpdateBookingRequest;
import com.groomish_now.backend.dto.staff.StaffCreateBookingRequest;
import com.groomish_now.backend.service.staff.StaffBookingService;
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

    @PostMapping("/{id}/no-show")
    public BookingResponse markNoShowForCustomer(
            HttpServletRequest request,
            @PathVariable UUID id,
            @RequestParam(required = false) String note
    ) {
        return staffBookingService.markNoShowForCustomer(getCurrentStaffId(request), id, note);
    }

    @PostMapping("/{id}/confirm")
    public BookingResponse confirmBookingForCustomer(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        return staffBookingService.confirmBookingForCustomer(getCurrentStaffId(request), id);
    }

    @PostMapping("/{id}/start")
    public BookingResponse startBookingForCustomer(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        return staffBookingService.startBookingForCustomer(getCurrentStaffId(request), id);
    }

    @PostMapping("/{id}/in-progress")
    public BookingResponse markBookingInProgress(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        return staffBookingService.startBookingForCustomer(getCurrentStaffId(request), id);
    }

    @PostMapping("/{id}/check-in")
    public BookingResponse checkInBookingForCustomer(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        return staffBookingService.checkInBookingForCustomer(getCurrentStaffId(request), id);
    }

    @PutMapping("/{id}/check-in")
    public BookingResponse checkInBookingForCustomerPut(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        return staffBookingService.checkInBookingForCustomer(getCurrentStaffId(request), id);
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
            @PathVariable UUID serviceId,
            @RequestParam(required = false) String subServiceName
    ) {
        return staffBookingService.addServiceToBooking(getCurrentStaffId(request), id, serviceId, subServiceName);
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
