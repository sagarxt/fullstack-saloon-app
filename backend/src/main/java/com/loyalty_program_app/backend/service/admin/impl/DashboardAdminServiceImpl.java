package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.booking.BookingItemResponse;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.dashboard.DashboardResponse;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.BookingItem;
import com.loyalty_program_app.backend.repository.BookingRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.admin.DashboardAdminService;
import com.loyalty_program_app.backend.mapper.BookingMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
public class DashboardAdminServiceImpl implements DashboardAdminService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookingMapper bookingMapper;

    public DashboardAdminServiceImpl(UserRepository userRepository,
                                     BookingRepository bookingRepository,
                                     BookingMapper bookingMapper) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.bookingMapper = bookingMapper;
    }

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
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
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

        // ========== RECENT BOOKINGS (latest 10 by creation date) ==========
        var bookings = bookingRepository.findAll(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
        dto.setRecentBookings(bookingMapper.toBookingResponseList(bookings));

        return dto;
    }
}
