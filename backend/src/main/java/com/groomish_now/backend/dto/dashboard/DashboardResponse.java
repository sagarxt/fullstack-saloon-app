package com.groomish_now.backend.dto.dashboard;

import com.groomish_now.backend.dto.booking.BookingResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    // Top-level / Legacy backward compatibility
    private long totalCustomers;
    private long totalStaff;
    private long totalAdmins;
    private long totalBookings;
    private double totalRevenue;
    private long todaysBookings;
    private List<BookingResponse> recentBookings;

    // Period info
    private String period; // "7D", "30D", "90D", "ALL", "CUSTOM"
    private String startDate;
    private String endDate;

    // 1. KPI Row
    private KpiMetrics kpi;

    // 2. Revenue and Growth
    private RevenueGrowth revenueGrowth;

    // 3. Operations
    private OperationsMetrics operations;

    // 4. Customers and Loyalty
    private CustomerLoyaltyMetrics customers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiMetrics {
        private double totalRevenue;
        private double servicesRevenue;
        private double productsRevenue;
        private double servicesSharePct;
        private double productsSharePct;

        private long totalBookings;
        private long completedBookings;
        private long cancelledBookings;
        private long noShowBookings;
        private double noShowRate; // e.g. 5.2%

        private double averageTicketValue; // ATV / AOV

        private long newCustomers;
        private long returningCustomers;
        private double returningCustomerRate;

        private long onlinePaymentsCount;
        private double onlineRevenue;
        private double onlineSharePct;

        private long payAtSalonCount;
        private double payAtSalonRevenue;
        private double payAtSalonSharePct;

        private long coinsIssued;
        private long coinsRedeemed;
        private long coinsActiveBalance;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueGrowth {
        private double currentPeriodRevenue;
        private double previousPeriodRevenue;
        private double revenueGrowthPct; // e.g. +14.2%
        private List<TrendPoint> trend; // with previous period overlaid

        private List<BranchRevenue> revenueByBranch;
        private List<CategoryRevenue> revenueByCategory;
        private List<TopService> topServices;
        private List<TopProduct> topProducts;

        private GstSummary gstSummary;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendPoint {
        private String date; // "14 Oct"
        private String fullDate; // "2026-10-14"
        private double currentRevenue;
        private double previousRevenue;
        private double servicesRevenue;
        private double productsRevenue;
        private long bookingsCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BranchRevenue {
        private UUID storeId;
        private String storeName;
        private String city;
        private double totalRevenue;
        private double servicesRevenue;
        private double productsRevenue;
        private long totalBookings;
        private long completedBookings;
        private double averageTicket;
        private double sharePct;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryRevenue {
        private String categoryName;
        private double revenue;
        private long bookingsCount;
        private double sharePct;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopService {
        private UUID serviceId;
        private String serviceName;
        private String categoryName;
        private double revenue;
        private long bookingsCount;
        private double averagePrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProduct {
        private UUID productId;
        private String productName;
        private String brand;
        private double revenue;
        private long unitsSold;
        private int stockQuantity;
        private boolean inStock;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GstSummary {
        private double taxableAmount;
        private double totalGst;
        private double cgst; // 9%
        private double sgst; // 9%
        private double effectiveRatePct; // 18.0%
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationsMetrics {
        private List<HeatmapCell> peakHoursHeatmap; // dayOfWeek (1-7) x hour (9-20)
        private String busiestDay;
        private String busiestHour;

        private List<BranchSlotUtilization> branchSlotUtilization;

        private double cancellationRate; // percentage
        private double rescheduleRate; // percentage
        private long totalRescheduled;
        private List<CancellationReason> cancellationReasons;

        private PaymentFunnel paymentFunnel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HeatmapCell {
        private int dayOfWeek; // 1 = Mon ... 7 = Sun
        private String dayName; // "Mon", "Tue"...
        private int hour; // 9 to 20
        private String hourLabel; // "09:00", "10:00"...
        private int count;
        private double intensity; // 0.0 to 1.0
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BranchSlotUtilization {
        private UUID storeId;
        private String storeName;
        private int totalCapacitySlots;
        private int bookedSlots;
        private double utilizationPct;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CancellationReason {
        private String reason;
        private long count;
        private double sharePct;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentFunnel {
        private long checkoutStarted;
        private long paidImmediately;
        private long payAtSalon;
        private long pendingOnlineAwaiting;
        private long failedOrCancelled;
        private double conversionRate; // percentage
        private double onlineDropOffRate; // percentage
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerLoyaltyMetrics {
        private List<TierCohort> tierDistribution;
        private List<TierMovement> tierMovement;

        private double repeatVisitRate; // percentage
        private double averageDaysBetweenVisits;

        private RetentionCohorts retention;

        private List<TopCustomer> topCustomers;
        private ReferralStats referralConversions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TierCohort {
        private String tier;
        private long count;
        private double sharePct;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TierMovement {
        private String userName;
        private String tier;
        private int lifetimePoints;
        private double totalSpend;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RetentionCohorts {
        private double within30DaysPct;
        private double within60DaysPct;
        private double within90DaysPct;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopCustomer {
        private UUID userId;
        private String name;
        private String email;
        private String phone;
        private String tier;
        private double totalSpend;
        private long bookingsCount;
        private int points;
        private String lastVisit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReferralStats {
        private long totalReferralInvites;
        private long successfulConversions;
        private double conversionRatePct;
        private long totalBonusCoinsAwarded;
    }
}
