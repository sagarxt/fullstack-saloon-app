package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.booking.BookingItemResponse;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.dashboard.DashboardResponse;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.BookingItem;
import com.loyalty_program_app.backend.repository.BookingRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.admin.DashboardAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardAdminServiceImpl implements DashboardAdminService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    @Override
    public DashboardResponse getDashboardData() {

        DashboardResponse dto = new DashboardResponse();

        // ========== USERS COUNT ==========
        dto.setTotalCustomers(userRepository.findByRole(Role.ROLE_CUSTOMER).size());
        dto.setTotalStaff(userRepository.findByRole(Role.ROLE_STAFF).size());
        dto.setTotalAdmins(userRepository.findByRole(Role.ROLE_ADMIN).size());

        // ========== BOOKINGS COUNT ==========
        dto.setTotalBookings(bookingRepository.count());

        // ========== TOTAL REVENUE ==========
        double totalRevenue = bookingRepository.findAll()
                .stream()
                .filter(b -> b.getPricePaid() != null)
                .mapToDouble(Booking::getPricePaid)
                .sum();

        dto.setTotalRevenue(totalRevenue);

        // ========== TODAY’S BOOKINGS ==========
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.atTime(23, 59, 59);

        long todaysBookings = bookingRepository.findAll()
                .stream()
                .filter(b -> b.getScheduledAt() != null &&
                        b.getScheduledAt().isAfter(start) &&
                        b.getScheduledAt().isBefore(end))
                .count();

        dto.setTodaysBookings(todaysBookings);

        // ========== RECENT BOOKINGS (latest 10) ==========
        var recentBookings = bookingRepository.findAll(PageRequest.of(0, 10))
                .getContent()
                .stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());

        dto.setRecentBookings(recentBookings);

        return dto;
    }

    // ========== MANUAL MAPPERS ==========

    private BookingResponse toBookingResponse(Booking b) {
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

        if (b.getBookingItems() != null) {
            dto.setItems(
                    b.getBookingItems().stream()
                            .map(this::toBookingItemResponse)
                            .collect(Collectors.toList())
            );
        }

        return dto;
    }

    private BookingItemResponse toBookingItemResponse(BookingItem item) {
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
