package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.booking.BookingItemResponse;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.booking.CustomerUpdateBookingRequest;
import com.loyalty_program_app.backend.dto.staff.StaffCreateBookingRequest;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.*;
import com.loyalty_program_app.backend.repository.*;
import com.loyalty_program_app.backend.service.interfaces.StaffBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffBookingServiceImpl implements StaffBookingService {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final BookingRepository bookingRepository;
    private final CouponRepository couponRepository;

    @Override
    public BookingResponse createBookingForCustomer(UUID staffId, StaffCreateBookingRequest request) {

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (request.getServiceIds() == null || request.getServiceIds().isEmpty()) {
            throw new RuntimeException("No services selected");
        }

        List<ServiceEntity> services = serviceRepository.findAllById(request.getServiceIds());
        if (services.size() != request.getServiceIds().size()) {
            throw new RuntimeException("One or more services not found");
        }

        LocalDateTime scheduledAt = LocalDateTime.parse(request.getScheduledAt());

        Booking booking = new Booking();
        booking.setUser(customer);
        booking.setScheduledAt(scheduledAt);
        booking.setStatus(BookingStatus.PENDING);
        booking.setNote(request.getNote());
        booking.setBookedBy("BOOKED_BY_STAFF - " + staff.getName());
        booking.setCreatedAt(LocalDateTime.now());

        List<BookingItem> items = new ArrayList<>();
        double totalAmount = 0;

        for (ServiceEntity s : services) {
            BookingItem item = new BookingItem();
            item.setBooking(booking);
            item.setService(s);
            item.setServiceNameSnapshot(s.getName());
            item.setServicePriceSnapshot(s.getPrice());
            item.setServiceDurationSnapshot(s.getDurationMinutes());
            item.setStatus(BookingStatus.PENDING);

            items.add(item);
            totalAmount += s.getPrice();
        }

        booking.setBookingItems(items);
        booking.setTotalAmount(totalAmount);

        double pricePaid = totalAmount;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(request.getCouponCode())
                    .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

            if (!coupon.isActive() || coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Coupon inactive or expired");
            }
            if (totalAmount < coupon.getMinAmount()) {
                throw new RuntimeException("Minimum amount for coupon is: " + coupon.getMinAmount());
            }

            double discount = coupon.getDiscount();
            if (coupon.getMaxDiscount() != null && discount > coupon.getMaxDiscount()) {
                discount = coupon.getMaxDiscount();
            }

            pricePaid = Math.max(totalAmount - discount, 0);
            booking.setCoupon(coupon);
        }

        booking.setPricePaid(pricePaid);

        bookingRepository.save(booking);
        return toDto(booking);
    }

    @Override
    public BookingResponse updateBookingForCustomer(UUID staffId, UUID bookingId, CustomerUpdateBookingRequest request) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot modify completed/cancelled booking");
        }

        if (request.getScheduledAt() != null) {
            booking.setScheduledAt(LocalDateTime.parse(request.getScheduledAt()));
        }
        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        booking.setStatus(BookingStatus.MODIFIED);
        booking.setBookedBy("MODIFIED_BY_STAFF - " + staff.getName());

        bookingRepository.save(booking);
        return toDto(booking);
    }

    @Override
    public BookingResponse cancelBookingForCustomer(UUID staffId, UUID bookingId, String note) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        if (note != null && !note.isBlank()) {
            booking.setNote(note);
        }

        booking.setBookedBy("MODIFIED_BY_STAFF - " + staff.getName());

        bookingRepository.save(booking);
        return toDto(booking);
    }

    @Override
    public Page<BookingResponse> getCustomerBookings(UUID customerId, Pageable pageable) {
        Page<Booking> page = bookingRepository.findAll(pageable);

        var filtered = page.getContent().stream()
                .filter(b -> b.getUser().getId().equals(customerId))
                .map(this::toDto)
                .collect(Collectors.toList());

        return new PageImpl<>(filtered, pageable, filtered.size());
    }

    @Override
    public BookingResponse getBooking(UUID bookingId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return toDto(b);
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

        if (b.getBookingItems() != null) {
            dto.setItems(
                    b.getBookingItems().stream()
                            .map(this::toBookingItemDto)
                            .collect(Collectors.toList())
            );
        }

        return dto;
    }

    private BookingItemResponse toBookingItemDto(BookingItem item) {
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
