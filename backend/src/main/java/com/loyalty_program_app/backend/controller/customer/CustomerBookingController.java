package com.loyalty_program_app.backend.controller.customer;
// package com.loyalty_program_app.backend.controller.customer;
import com.loyalty_program_app.backend.dto.booking.BookingCreateRequest;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.service.impl.CustomerBookingServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/bookings")
@RequiredArgsConstructor
public class CustomerBookingController {

    private final CustomerBookingServiceImpl bookingService;

    // create booking (authenticated customer)
    @PostMapping
    public ResponseEntity<BookingResponse> create(@RequestBody BookingCreateRequest req, Authentication auth) {
        String userId = (String) auth.getPrincipal(); // jwt filter sets principal to userId
        return ResponseEntity.ok(bookingService.createBooking(UUID.fromString(userId), req));
    }

    // get all bookings for current customer
    @GetMapping
    public ResponseEntity<List<BookingResponse>> getMine(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(bookingService.getBookingsForUser(UUID.fromString(userId)));
    }

    // get single booking (ensure ownership inside service)
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getOne(@PathVariable UUID id, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(bookingService.getBookingForUser(UUID.fromString(userId), id));
    }

    // cancel booking (soft delete or status change)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable UUID id, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        bookingService.cancelBooking(UUID.fromString(userId), id);
        return ResponseEntity.noContent().build();
    }
}
