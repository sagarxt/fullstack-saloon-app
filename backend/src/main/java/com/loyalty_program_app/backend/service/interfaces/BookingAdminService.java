package com.loyalty_program_app.backend.service.interfaces;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.booking.BookingUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface BookingAdminService {

    Page<BookingResponse> searchBookings(
            String bookingId,
            String customerName,
            String customerEmail,
            String status,
            String fromDate,
            String toDate,
            Pageable pageable
    );

    BookingResponse getBookingById(UUID id);

    BookingResponse updateBooking(UUID id, BookingUpdateRequest request);

    BookingResponse cancelBooking(UUID id, String note);
}
