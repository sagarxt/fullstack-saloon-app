package com.groomish_now.backend.service.admin;

import com.groomish_now.backend.dto.booking.BookingResponse;
import com.groomish_now.backend.dto.booking.BookingUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface BookingAdminService {

    Page<BookingResponse> searchBookings(
            String bookingId,
            String customerName,
            String customerEmail,
            String status,
            UUID storeId,
            String fromDate,
            String toDate,
            Pageable pageable
    );

    BookingResponse getBookingById(UUID id);

    BookingResponse updateBooking(UUID id, BookingUpdateRequest request);

    BookingResponse cancelBooking(UUID id, String note);

    BookingResponse checkInBooking(UUID id);
}
