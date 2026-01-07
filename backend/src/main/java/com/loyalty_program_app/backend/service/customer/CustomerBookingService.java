package com.loyalty_program_app.backend.service.customer;

import com.loyalty_program_app.backend.dto.booking.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CustomerBookingService {

    BookingResponse createBooking(
            UUID userId,
            CustomerCreateBookingRequest request
    );

    BookingPreviewResponse previewBooking(
            BookingPreviewRequest request
    );

    SlotAvailabilityResponse getUnavailableSlots(
            LocalDate date,
            UUID serviceId
    );

    List<BookingResponse> getMyBookings(
            UUID userId
    );

    BookingDetailsResponse getMyBookingById(
            UUID userId,
            UUID bookingId
    );

    BookingResponse rescheduleBooking(
            UUID userId,
            UUID bookingId,
            RescheduleBookingRequest request
    );

    BookingResponse cancelBooking(
            UUID userId,
            UUID bookingId
    );
}
