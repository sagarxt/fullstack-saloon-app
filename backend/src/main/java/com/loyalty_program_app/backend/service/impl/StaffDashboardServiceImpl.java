package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.booking.BookingItemResponse;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.staff.StaffDashboardResponse;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.BookingItem;
import com.loyalty_program_app.backend.model.Payment;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.BookingRepository;
import com.loyalty_program_app.backend.repository.PaymentRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.interfaces.StaffDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffDashboardServiceImpl implements StaffDashboardService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    @Override
    public StaffDashboardResponse getDashboard(UUID staffId) {

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        String staffTag = "BOOKED_BY_STAFF - " + staff.getName();

        List<Booking> allBookings = bookingRepository.findAll();

        // Filter: bookings created by this staff
        List<Booking> staffBookings = allBookings.stream()
                .filter(b -> b.getBookedBy() != null && b.getBookedBy().contains(staffTag))
                .toList();

        LocalDate today = LocalDate.now();

        List<Booking> todayBookings = staffBookings.stream()
                .filter(b -> b.getCreatedAt() != null && b.getCreatedAt().toLocalDate().isEqual(today))
                .toList();

        long completed = todayBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .count();

        long cancelled = todayBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED)
                .count();

        long pending = todayBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING)
                .count();

        // Revenue for staff’s completed bookings for today
        double todayRevenue = staffBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .filter(b -> b.getCompletedAt() != null &&
                        b.getCompletedAt().toLocalDate().isEqual(today))
                .mapToDouble(Booking::getPricePaid)
                .sum();

        // Customers registered by this staff
        long registeredCustomers = userRepository.findAll().stream()
                .filter(u -> staffId.equals(u.getCreatedBy()))
                .count();

        // Upcoming (scheduledAt in future)
        List<BookingResponse> upcoming = staffBookings.stream()
                .filter(b -> b.getScheduledAt() != null && b.getScheduledAt().isAfter(LocalDateTime.now()))
                .sorted(Comparator.comparing(Booking::getScheduledAt))
                .limit(10)
                .map(this::toDto)
                .toList();

        // Recent (last 10 created)
        List<BookingResponse> recent = staffBookings.stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt).reversed())
                .limit(10)
                .map(this::toDto)
                .toList();

        StaffDashboardResponse resp = new StaffDashboardResponse();
        resp.setTotalBookingsByStaff(staffBookings.size());
        resp.setTodaysBookings(todayBookings.size());
        resp.setTodaysCompleted(completed);
        resp.setTodaysCancelled(cancelled);
        resp.setTodaysPending(pending);
        resp.setTodaysRevenue(todayRevenue);
        resp.setTotalCustomersRegisteredByStaff(registeredCustomers);
        resp.setUpcomingBookings(upcoming);
        resp.setRecentBookings(recent);

        return resp;
    }

    private BookingResponse toDto(Booking b) {
        BookingResponse dto = new BookingResponse();
        dto.setId(b.getId());
        dto.setUserId(b.getUser().getId());
        dto.setUserName(b.getUser().getName());
        dto.setPaymentId(b.getPayment() != null ? b.getPayment().getId() : null);
        dto.setCouponId(b.getCoupon() != null ? b.getCoupon().getId() : null);
        dto.setTotalAmount(b.getTotalAmount());
        dto.setPricePaid(b.getPricePaid());
        dto.setStatus(b.getStatus().name());
        dto.setScheduledAt(b.getScheduledAt() != null ? b.getScheduledAt().toString() : null);
        dto.setNote(b.getNote());
        dto.setBookedBy(b.getBookedBy());

        List<BookingItemResponse> items = b.getBookingItems().stream()
                .map(this::toItemDto)
                .toList();
        dto.setItems(items);

        return dto;
    }

    private BookingItemResponse toItemDto(BookingItem item) {
        BookingItemResponse dto = new BookingItemResponse();
        dto.setId(item.getId());
        dto.setServiceId(item.getService().getId());
        dto.setServiceName(item.getServiceNameSnapshot());
        dto.setServicePrice(item.getServicePriceSnapshot());
        dto.setDuration(item.getServiceDurationSnapshot());
        dto.setStatus(item.getStatus().name());
        return dto;
    }
}
