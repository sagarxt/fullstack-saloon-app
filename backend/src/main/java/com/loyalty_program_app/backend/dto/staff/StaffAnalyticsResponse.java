package com.loyalty_program_app.backend.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffAnalyticsResponse {

    private UUID storeId;
    private String storeName;
    private String storeCode;
    private String storeAddress;

    private String period; // DAY, WEEK, MONTH, CUSTOM
    private LocalDate startDate;
    private LocalDate endDate;

    // Overview KPIs
    private long totalBookings;
    private long completedBookings;
    private long cancelledBookings;
    private long pendingBookings;
    private double totalRevenue;
    private double averageOrderValue;
    private double averageDurationMinutes;

    // Day-wise / Time series trend
    private List<DailyMetricDto> dailyTrends;

    // Payment method breakdown (Amount & Count)
    private Map<String, Double> paymentMethodRevenue;
    private Map<String, Long> paymentMethodCount;

    // Top services & products
    private List<ServiceStatDto> topServices;
    private List<ProductStatDto> topProducts;
}
