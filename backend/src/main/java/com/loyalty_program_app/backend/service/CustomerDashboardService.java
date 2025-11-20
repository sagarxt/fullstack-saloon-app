package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.customer.CustomerDashboardResponse;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.ServiceEntity;
import com.loyalty_program_app.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerDashboardService {

    private final BookingRepository bookingRepo;
    private final ServiceRepository serviceRepo;
    private final PointsService pointsService;

    public CustomerDashboardResponse getDashboard(UUID userId) {

        double points = pointsService.getBalance(userId);

        List<Booking> allBookings = bookingRepo.findByUserId(userId);

        List<Booking> upcoming = allBookings.stream()
                .filter(b -> b.getScheduledAt() != null &&
                        b.getScheduledAt().isAfter(OffsetDateTime.now()) &&
                        b.getStatus() != BookingStatus.CANCELLED)
                .toList();

        Booking nextBooking = upcoming.stream()
                .sorted(Comparator.comparing(Booking::getScheduledAt))
                .findFirst()
                .orElse(null);

        List<Booking> recent = allBookings.stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt).reversed())
                .limit(3)
                .toList();

        List<ServiceEntity> topServices = serviceRepo.findTop3ByOrderByCreatedAtDesc();

        return CustomerDashboardResponse.builder()
                .points(points)
                .totalBookings(allBookings.size())
                .completedBookings((int) allBookings.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count())
                .upcomingBookings(upcoming.size())
                .nextBooking(nextBooking != null ? toResponse(nextBooking) : null)
                .recentBookings(recent.stream().map(this::toResponse).toList())
                .recommendedServices(topServices.stream().map(this::toServiceResponse).toList())
                .build();
    }

    private BookingResponse toResponse(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .serviceId(b.getServiceId())
                .scheduledAt(b.getScheduledAt())
                .status(b.getStatus())
                .pricePaid(b.getPricePaid())
                .build();
    }

    private ServiceResponse toServiceResponse(ServiceEntity s) {
        return ServiceResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .mrp(s.getMrp())
                .price(s.getPrice())
                .durationMinutes(s.getDurationMinutes())
                .description(s.getDescription())
                .build();
    }
}
