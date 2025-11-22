package com.loyalty_program_app.backend.dto.staff;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import lombok.Data;

import java.util.List;

@Data
public class StaffDashboardResponse {

    private long totalBookingsByStaff;
    private long todaysBookings;
    private long todaysCompleted;
    private long todaysCancelled;
    private long todaysPending;

    private double todaysRevenue;

    private long totalCustomersRegisteredByStaff;

    private List<BookingResponse> upcomingBookings;
    private List<BookingResponse> recentBookings;
}
