package com.groomish_now.backend.dto.dashboard;

import com.groomish_now.backend.dto.booking.BookingResponse;
import lombok.Data;

import java.util.List;

@Data
public class DashboardResponse {

    private long totalCustomers;
    private long totalStaff;
    private long totalAdmins;
    private long totalBookings;
    private double totalRevenue;

    private long todaysBookings;

    private List<BookingResponse> recentBookings; // last 10 bookings
}
