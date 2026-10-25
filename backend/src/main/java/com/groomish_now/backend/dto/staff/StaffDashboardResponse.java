package com.groomish_now.backend.dto.staff;

import com.groomish_now.backend.dto.booking.BookingResponse;
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

    private List<BookingResponse> todaysBookingsList;
    private List<BookingResponse> upcomingBookings;
    private List<BookingResponse> completedBookings;
    private List<BookingResponse> allBookings;
    private List<BookingResponse> recentBookings;

    private java.util.UUID storeId;
    private String storeName;
    private String storeCode;
    private String storeAddress;
}
