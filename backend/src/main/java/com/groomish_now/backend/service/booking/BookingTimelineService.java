package com.groomish_now.backend.service.booking;

import com.groomish_now.backend.dto.booking.BookingTimelineResponse;
import com.groomish_now.backend.model.Booking;
import com.groomish_now.backend.model.BookingTimeline;

import java.util.List;
import java.util.UUID;

public interface BookingTimelineService {

    BookingTimeline recordTimeline(
            Booking booking,
            String action,
            String title,
            String description,
            String performedBy,
            String role,
            String email
    );

    BookingTimeline recordTimeline(
            UUID bookingId,
            String action,
            String title,
            String description,
            String performedBy,
            String role,
            String email
    );

    List<BookingTimelineResponse> getTimelineForBooking(Booking booking);

    List<BookingTimelineResponse> getTimelineForBookingId(UUID bookingId);
}
