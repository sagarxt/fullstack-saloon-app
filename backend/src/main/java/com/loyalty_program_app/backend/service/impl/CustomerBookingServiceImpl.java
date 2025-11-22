package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.booking.BookingItemResponse;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.booking.CustomerCreateBookingRequest;
import com.loyalty_program_app.backend.dto.booking.CustomerUpdateBookingRequest;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.*;
import com.loyalty_program_app.backend.repository.*;
import com.loyalty_program_app.backend.service.interfaces.CustomerBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerBookingServiceImpl implements CustomerBookingService {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final BookingRepository bookingRepository;
    private final CouponRepository couponRepository;

    @Override
    public BookingResponse createBooking(UUID userId, CustomerCreateBookingRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getServiceIds() == null || request.getServiceIds().isEmpty()) {
            throw new RuntimeException("No services selected");
        }

        List<ServiceEntity> services = serviceRepository.findAllById(request.getServiceIds());

        if (services.size() != request.getServiceIds().size()) {
            throw new RuntimeException("One or more services not found");
        }

        LocalDateTime scheduledAt = LocalDateTime.parse(request.getScheduledAt());

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setScheduledAt(scheduledAt);
        booking.setStatus(BookingStatus.PENDING);
        booking.setNote(request.getNote());
        booking.setBookedBy("BOOKED_BY_SELF");
        booking.setCreatedAt(LocalDateTime.now());

        // add items & calculate amount
        List<BookingItem> items = new ArrayList<>();
        double totalAmount = 0;
        int totalDuration = 0;

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
            totalDuration += s.getDurationMinutes();
        }

        booking.setBookingItems(items);
        booking.setTotalAmount(totalAmount);

        // apply coupon if provided
        double pricePaid = totalAmount;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(request.getCouponCode())
                    .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

            // simple validation (you already have admin coupon validation)
            if (!coupon.isActive() || coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Coupon is inactive or expired");
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

        return toBookingResponse(booking);
    }

    @Override
    public Page<BookingResponse> listMyBookings(UUID userId, Pageable pageable) {
        Page<Booking> page = bookingRepository.findAll(pageable)
                .map(b -> b); // we will filter in-memory for simplicity

        List<BookingResponse> filtered = page.getContent().stream()
                .filter(b -> b.getUser().getId().equals(userId))
                .map(this::toBookingResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(filtered, pageable, filtered.size());
    }

    @Override
    public BookingResponse getMyBooking(UUID userId, UUID bookingId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!b.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not allowed to access this booking");
        }

        return toBookingResponse(b);
    }

    @Override
    public BookingResponse updateMyBooking(UUID userId, UUID bookingId, CustomerUpdateBookingRequest request) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!b.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not allowed to modify this booking");
        }

        if (b.getStatus() == BookingStatus.CANCELLED || b.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot modify completed/cancelled booking");
        }

        if (request.getScheduledAt() != null) {
            b.setScheduledAt(LocalDateTime.parse(request.getScheduledAt()));
        }
        if (request.getNote() != null) {
            b.setNote(request.getNote());
        }

        b.setStatus(BookingStatus.MODIFIED);
        b.setBookedBy("MODIFIED_BY_SELF");

        bookingRepository.save(b);
        return toBookingResponse(b);
    }

    @Override
    public BookingResponse cancelMyBooking(UUID userId, UUID bookingId, String note) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!b.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not allowed to cancel this booking");
        }

        b.setStatus(BookingStatus.CANCELLED);
        b.setCancelledAt(LocalDateTime.now());
        if (note != null && !note.isBlank()) {
            b.setNote(note);
        }

        bookingRepository.save(b);
        return toBookingResponse(b);
    }

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
