package com.loyalty_program_app.backend.dto.customer;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CustomerDashboardResponse {
    private double points;
    private int totalBookings;
    private int completedBookings;
    private int upcomingBookings;

    private BookingResponse nextBooking;
    private List<BookingResponse> recentBookings;
    private List<ServiceResponse> recommendedServices;
}
