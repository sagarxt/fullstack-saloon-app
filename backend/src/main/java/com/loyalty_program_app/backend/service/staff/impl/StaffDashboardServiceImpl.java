package com.loyalty_program_app.backend.service.staff.impl;

import com.loyalty_program_app.backend.dto.booking.BookingItemDetailsResponse;
import com.loyalty_program_app.backend.dto.booking.BookingItemResponse;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.product.BookingProductResponse;
import com.loyalty_program_app.backend.dto.staff.*;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.BookingItem;
import com.loyalty_program_app.backend.model.BookingProduct;
import com.loyalty_program_app.backend.model.Store;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.BookingItemRepository;
import com.loyalty_program_app.backend.repository.BookingProductRepository;
import com.loyalty_program_app.backend.repository.BookingRepository;
import com.loyalty_program_app.backend.repository.PaymentRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.staff.StaffDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StaffDashboardServiceImpl implements StaffDashboardService {

    private final BookingRepository bookingRepository;
    private final BookingItemRepository bookingItemRepository;
    private final BookingProductRepository bookingProductRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final com.loyalty_program_app.backend.mapper.BookingMapper bookingMapper;

    public StaffDashboardServiceImpl(
            BookingRepository bookingRepository,
            BookingItemRepository bookingItemRepository,
            BookingProductRepository bookingProductRepository,
            PaymentRepository paymentRepository,
            UserRepository userRepository,
            com.loyalty_program_app.backend.mapper.BookingMapper bookingMapper) {
        this.bookingRepository = bookingRepository;
        this.bookingItemRepository = bookingItemRepository;
        this.bookingProductRepository = bookingProductRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.bookingMapper = bookingMapper;
    }

    @Override
    public StaffDashboardResponse getDashboard(UUID staffId) {

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        String staffTag = "BOOKED_BY_STAFF - " + staff.getName();

        List<Booking> allBookings = bookingRepository.findAll();

        // Filter: bookings for this staff's store branch OR created by this staff
        List<Booking> staffBookings = allBookings.stream()
                .filter(b -> {
                    if (staff.getStore() != null && b.getStore() != null && b.getStore().getId().equals(staff.getStore().getId())) {
                        return true;
                    }
                    return b.getBookedBy() != null && b.getBookedBy().contains(staffTag);
                })
                .toList();

        LocalDate today = LocalDate.now();

        // 1. All Bookings for this staff's store branch (sorted by scheduled date desc)
        List<BookingResponse> allBookingsList = staffBookings.stream()
                .sorted(Comparator.comparing((Booking b) -> b.getScheduledAt() != null ? b.getScheduledAt() : b.getCreatedAt(), Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();

        // 2. Today's Bookings: scheduled for today (or created today if scheduledAt is null)
        List<Booking> todayBookings = staffBookings.stream()
                .filter(b -> {
                    if (b.getScheduledAt() != null) {
                        return b.getScheduledAt().toLocalDate().isEqual(today);
                    }
                    return b.getCreatedAt() != null && b.getCreatedAt().toLocalDate().isEqual(today);
                })
                .sorted(Comparator.comparing(b -> b.getScheduledAt() != null ? b.getScheduledAt() : b.getCreatedAt(), Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        List<BookingResponse> todaysBookingsList = todayBookings.stream()
                .map(this::toDto)
                .toList();

        long completed = todayBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .count();

        long cancelled = todayBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED)
                .count();

        long pending = todayBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING || b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.MODIFIED)
                .count();

        // Revenue for staff’s completed bookings for today
        double todayRevenue = staffBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .filter(b -> (b.getCompletedAt() != null && b.getCompletedAt().toLocalDate().isEqual(today))
                        || (b.getScheduledAt() != null && b.getScheduledAt().toLocalDate().isEqual(today)))
                .mapToDouble(Booking::getPricePaid)
                .sum();

        // Customers registered by this staff
        long registeredCustomers = userRepository.countByCreatedBy(staffId);

        // 3. Upcoming Bookings: scheduled strictly in future dates / later today and not cancelled or completed
        List<BookingResponse> upcoming = staffBookings.stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED && b.getStatus() != BookingStatus.COMPLETED)
                .filter(b -> b.getScheduledAt() != null && b.getScheduledAt().isAfter(LocalDateTime.now()))
                .sorted(Comparator.comparing(Booking::getScheduledAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toDto)
                .toList();

        // 4. Completed History: all completed treatments
        List<BookingResponse> completedList = staffBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .sorted(Comparator.comparing((Booking b) -> b.getCompletedAt() != null ? b.getCompletedAt() : (b.getScheduledAt() != null ? b.getScheduledAt() : b.getCreatedAt()), Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();

        // 5. Recent (all latest created)
        List<BookingResponse> recent = staffBookings.stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();

        StaffDashboardResponse resp = new StaffDashboardResponse();
        if (staff.getStore() != null) {
            resp.setStoreId(staff.getStore().getId());
            resp.setStoreName(staff.getStore().getName());
            resp.setStoreCode(staff.getStore().getCode());
            resp.setStoreAddress(staff.getStore().getAddress() + ", " + staff.getStore().getCity());
        }
        resp.setTotalBookingsByStaff(staffBookings.size());
        resp.setTodaysBookings(todayBookings.size());
        resp.setTodaysCompleted(completed);
        resp.setTodaysCancelled(cancelled);
        resp.setTodaysPending(pending);
        resp.setTodaysRevenue(todayRevenue);
        resp.setTotalCustomersRegisteredByStaff(registeredCustomers);
        resp.setTodaysBookingsList(todaysBookingsList);
        resp.setUpcomingBookings(upcoming);
        resp.setCompletedBookings(completedList);
        resp.setAllBookings(allBookingsList);
        resp.setRecentBookings(recent);

        return resp;
    }

    @Override
    public StaffAnalyticsResponse getBranchAnalytics(UUID staffId, String period, LocalDate startDate, LocalDate endDate) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Store store = staff.getStore();
        String staffTag = "BOOKED_BY_STAFF - " + staff.getName();

        LocalDate today = LocalDate.now();
        String normalizedPeriod = period != null ? period.trim().toUpperCase() : "WEEK";

        LocalDate start;
        LocalDate end;

        switch (normalizedPeriod) {
            case "DAY" -> {
                start = (startDate != null) ? startDate : today;
                end = start;
            }
            case "WEEK" -> {
                end = (endDate != null) ? endDate : today;
                start = (startDate != null) ? startDate : end.minusDays(6);
            }
            case "MONTH" -> {
                end = (endDate != null) ? endDate : today;
                start = (startDate != null) ? startDate : end.minusDays(29);
            }
            case "CUSTOM" -> {
                end = (endDate != null) ? endDate : today;
                start = (startDate != null) ? startDate : end.minusDays(7);
            }
            default -> {
                normalizedPeriod = "WEEK";
                end = today;
                start = end.minusDays(6);
            }
        }

        if (start.isAfter(end)) {
            LocalDate tmp = start;
            start = end;
            end = tmp;
        }

        if (start.isBefore(end.minusDays(365))) {
            start = end.minusDays(365);
        }

        List<Booking> allBookings = bookingRepository.findAll();

        List<Booking> branchBookings = allBookings.stream()
                .filter(b -> {
                    if (store != null && b.getStore() != null && b.getStore().getId().equals(store.getId())) {
                        return true;
                    }
                    return b.getBookedBy() != null && b.getBookedBy().contains(staffTag);
                })
                .toList();

        final LocalDate finalStart = start;
        final LocalDate finalEnd = end;

        List<Booking> periodBookings = branchBookings.stream()
                .filter(b -> {
                    LocalDate bDate = (b.getScheduledAt() != null) ? b.getScheduledAt().toLocalDate()
                            : ((b.getCreatedAt() != null) ? b.getCreatedAt().toLocalDate() : null);
                    if (bDate == null) return false;
                    return !bDate.isBefore(finalStart) && !bDate.isAfter(finalEnd);
                })
                .toList();

        long totalBookings = periodBookings.size();
        long completedBookings = periodBookings.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count();
        long cancelledBookings = periodBookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();
        long pendingBookings = periodBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING || b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.MODIFIED)
                .count();

        double totalRevenue = periodBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .mapToDouble(b -> b.getPricePaid() != null ? b.getPricePaid() : (b.getTotalAmount() != null ? b.getTotalAmount() : 0.0))
                .sum();

        double averageOrderValue = completedBookings > 0 ? (totalRevenue / completedBookings) : 0.0;

        double averageDuration = periodBookings.stream()
                .filter(b -> b.getTotalDurationMinutes() != null && b.getTotalDurationMinutes() > 0)
                .mapToInt(Booking::getTotalDurationMinutes)
                .average()
                .orElse(0.0);

        DateTimeFormatter labelFmt = DateTimeFormatter.ofPattern("dd MMM");
        List<DailyMetricDto> dailyTrends = new ArrayList<>();
        LocalDate curr = finalStart;
        while (!curr.isAfter(finalEnd)) {
            final LocalDate dateToMatch = curr;
            List<Booking> dayBookings = periodBookings.stream()
                    .filter(b -> {
                        LocalDate bDate = (b.getScheduledAt() != null) ? b.getScheduledAt().toLocalDate()
                                : ((b.getCreatedAt() != null) ? b.getCreatedAt().toLocalDate() : null);
                        return bDate != null && bDate.isEqual(dateToMatch);
                    })
                    .toList();

            long dayCompleted = dayBookings.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count();
            long dayCancelled = dayBookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();
            double dayRevenue = dayBookings.stream()
                    .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                    .mapToDouble(b -> b.getPricePaid() != null ? b.getPricePaid() : (b.getTotalAmount() != null ? b.getTotalAmount() : 0.0))
                    .sum();

            dailyTrends.add(DailyMetricDto.builder()
                    .date(curr.toString())
                    .label(curr.format(labelFmt))
                    .bookingsCount(dayBookings.size())
                    .completedCount(dayCompleted)
                    .cancelledCount(dayCancelled)
                    .revenue(dayRevenue)
                    .build());

            curr = curr.plusDays(1);
        }

        Map<String, Double> paymentMethodRevenue = new LinkedHashMap<>();
        Map<String, Long> paymentMethodCount = new LinkedHashMap<>();
        for (Booking b : periodBookings) {
            if (b.getStatus() == BookingStatus.COMPLETED) {
                String method = "CASH";
                if (b.getPayment() != null && b.getPayment().getPaymentMethod() != null) {
                    method = b.getPayment().getPaymentMethod().name();
                }
                double amt = b.getPricePaid() != null ? b.getPricePaid() : (b.getTotalAmount() != null ? b.getTotalAmount() : 0.0);
                paymentMethodRevenue.merge(method, amt, Double::sum);
                paymentMethodCount.merge(method, 1L, Long::sum);
            }
        }

        Map<String, long[]> serviceStats = new HashMap<>();
        for (Booking b : periodBookings) {
            if (b.getStatus() == BookingStatus.COMPLETED && b.getBookingItems() != null) {
                for (BookingItem item : b.getBookingItems()) {
                    String name = item.getServiceNameSnapshot() != null ? item.getServiceNameSnapshot() : "Unknown Service";
                    double price = item.getServicePriceSnapshot() != null ? item.getServicePriceSnapshot() : 0.0;
                    serviceStats.computeIfAbsent(name, k -> new long[]{0, 0});
                    serviceStats.get(name)[0] += 1;
                    serviceStats.get(name)[1] += (long) price;
                }
            }
        }

        List<ServiceStatDto> topServices = serviceStats.entrySet().stream()
                .map(e -> ServiceStatDto.builder()
                        .serviceName(e.getKey())
                        .bookingCount(e.getValue()[0])
                        .totalRevenue((double) e.getValue()[1])
                        .build())
                .sorted(Comparator.comparing(ServiceStatDto::getBookingCount).reversed())
                .limit(10)
                .toList();

        Map<String, long[]> productStats = new HashMap<>();
        for (Booking b : periodBookings) {
            if (b.getStatus() == BookingStatus.COMPLETED && b.getBookingProducts() != null) {
                for (BookingProduct bp : b.getBookingProducts()) {
                    String name = bp.getProductNameSnapshot() != null ? bp.getProductNameSnapshot() : "Store Product";
                    int qty = bp.getQuantity() != null ? bp.getQuantity() : 1;
                    double tot = bp.getTotalPrice() != null ? bp.getTotalPrice() : (bp.getUnitPriceSnapshot() != null ? bp.getUnitPriceSnapshot() * qty : 0.0);
                    productStats.computeIfAbsent(name, k -> new long[]{0, 0});
                    productStats.get(name)[0] += qty;
                    productStats.get(name)[1] += (long) tot;
                }
            }
        }

        List<ProductStatDto> topProducts = productStats.entrySet().stream()
                .map(e -> ProductStatDto.builder()
                        .productName(e.getKey())
                        .quantitySold(e.getValue()[0])
                        .totalRevenue((double) e.getValue()[1])
                        .build())
                .sorted(Comparator.comparing(ProductStatDto::getQuantitySold).reversed())
                .limit(10)
                .toList();

        StaffAnalyticsResponse resp = StaffAnalyticsResponse.builder()
                .storeId(store != null ? store.getId() : null)
                .storeName(store != null ? store.getName() : "Assigned Branch")
                .storeCode(store != null ? store.getCode() : null)
                .storeAddress(store != null ? store.getAddress() + ", " + store.getCity() : null)
                .period(normalizedPeriod)
                .startDate(finalStart)
                .endDate(finalEnd)
                .totalBookings(totalBookings)
                .completedBookings(completedBookings)
                .cancelledBookings(cancelledBookings)
                .pendingBookings(pendingBookings)
                .totalRevenue(totalRevenue)
                .averageOrderValue(Math.round(averageOrderValue * 100.0) / 100.0)
                .averageDurationMinutes(Math.round(averageDuration * 10.0) / 10.0)
                .dailyTrends(dailyTrends)
                .paymentMethodRevenue(paymentMethodRevenue)
                .paymentMethodCount(paymentMethodCount)
                .topServices(topServices)
                .topProducts(topProducts)
                .build();

        return resp;
    }

    private BookingResponse toDto(Booking b) {
        return bookingMapper.toBookingResponse(b);
    }
}
