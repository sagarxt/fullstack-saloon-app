package com.loyalty_program_app.backend.service.customer;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.booking.CustomerCreateBookingRequest;
import com.loyalty_program_app.backend.dto.booking.CustomerUpdateBookingRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerBookingService {

    BookingResponse createBooking(UUID userId, CustomerCreateBookingRequest request);

    Page<BookingResponse> listMyBookings(UUID userId, Pageable pageable);

    BookingResponse getMyBooking(UUID userId, UUID bookingId);

    BookingResponse updateMyBooking(UUID userId, UUID bookingId, CustomerUpdateBookingRequest request);

    BookingResponse cancelMyBooking(UUID userId, UUID bookingId, String note);
}
