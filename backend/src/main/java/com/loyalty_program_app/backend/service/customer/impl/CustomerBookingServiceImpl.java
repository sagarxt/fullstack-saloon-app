package com.loyalty_program_app.backend.service.customer.impl;

import com.loyalty_program_app.backend.dto.booking.*;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.*;
import com.loyalty_program_app.backend.repository.*;
import com.loyalty_program_app.backend.service.customer.CustomerBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
    private final BookingItemRepository bookingItemRepository;

    /* =====================================================
       CREATE BOOKING
       ===================================================== */
    @Override
    public BookingResponse createBooking(UUID userId,
                                         CustomerCreateBookingRequest request) {

        if (request.getServiceId() == null) {
            throw new RuntimeException("Service is required");
        }

        if (request.getScheduledAt() == null) {
            throw new RuntimeException("Booking date/time is required");
        }

        ServiceEntity service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        Coupon coupon = null;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            coupon = couponRepository
                    .findByCodeAndActiveTrue(request.getCouponCode())
                    .orElseThrow(() -> new RuntimeException("Invalid coupon code"));
        }

        // calculate price
        double finalPrice = service.getPrice();
        if (coupon != null) {
            finalPrice = applyCoupon(finalPrice, coupon.getCode());
        }

        Booking booking = new Booking();
        booking.setUser(userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found")));
        booking.setScheduledAt(request.getScheduledAt());
        booking.setNote(request.getNote());
        booking.setCoupon(coupon);
        booking.setTotalAmount(service.getPrice());
        booking.setPricePaid(finalPrice);
        booking.setStatus(BookingStatus.PENDING);
        booking.setBookedBy("BOOKED_BY_SELF");
        booking.setTotalDurationMinutes(service.getDurationMinutes());

        bookingRepository.save(booking);

        // booking item snapshot
        BookingItem item = new BookingItem();
        item.setBooking(booking);
        item.setService(service);
        item.setServiceNameSnapshot(service.getName());
        item.setServicePriceSnapshot(service.getPrice());
        item.setServiceDurationSnapshot(service.getDurationMinutes());
        item.setStatus(BookingStatus.PENDING);

        bookingItemRepository.save(item);

        BookingResponse response = new BookingResponse();

        response.setId(booking.getId());
        response.setServiceId(service.getId());
        response.setServiceName(service.getName());

        response.setScheduledAt(booking.getScheduledAt());
        response.setNote(booking.getNote());

        response.setTotalAmount(booking.getTotalAmount());
        response.setPricePaid(booking.getPricePaid());

        response.setStatus(booking.getStatus().name());

        return response;
    }

    private Double applyCoupon(Double price, String coupon){
        return price;
    }

    /* =====================================================
       PREVIEW BOOKING (COUPON + REWARDS)
       ===================================================== */
    @Override
    public BookingPreviewResponse previewBooking(
            BookingPreviewRequest request
    ) {

        List<ServiceEntity> services =
                serviceRepository.findAllById(request.getServiceIds());

        double totalAmount =
                services.stream()
                        .mapToDouble(ServiceEntity::getPrice)
                        .sum();

        double discount = 0;

        if (request.getCouponCode() != null &&
                !request.getCouponCode().isBlank()) {

            Coupon coupon = couponRepository
                    .findByCodeIgnoreCase(request.getCouponCode())
                    .orElseThrow(() -> new RuntimeException("Invalid coupon"));

            if (coupon.isActive() &&
                    !coupon.getExpiryDate().isBefore(LocalDateTime.now()) &&
                    totalAmount >= coupon.getMinAmount()) {

                discount = coupon.getDiscount();
                if (coupon.getMaxDiscount() != null &&
                        discount > coupon.getMaxDiscount()) {
                    discount = coupon.getMaxDiscount();
                }
            }
        }

        double finalPrice = Math.max(totalAmount - discount, 0);

        int rewards =
                services.stream()
                        .mapToInt(ServiceEntity::getRewards)
                        .sum();

        return new BookingPreviewResponse(
                totalAmount,
                discount,
                finalPrice,
                rewards
        );
    }

    /* =====================================================
       SLOT AVAILABILITY
       ===================================================== */
    @Override
    public SlotAvailabilityResponse getUnavailableSlots(
            LocalDate date,
            UUID serviceId
    ) {

        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        List<Booking> bookings =
                bookingRepository.findBookingsForDate(date);

        List<String> blockedSlots = new ArrayList<>();

        for (Booking b : bookings) {
            LocalDateTime start = b.getScheduledAt();
            LocalDateTime end =
                    start.plusMinutes(b.getTotalDurationMinutes());

            LocalDateTime cursor = start;
            while (cursor.isBefore(end)) {
                blockedSlots.add(
                        String.format("%02d:%02d",
                                cursor.getHour(),
                                cursor.getMinute())
                );
                cursor = cursor.plusMinutes(30);
            }
        }

        return new SlotAvailabilityResponse(blockedSlots);
    }

    /* =====================================================
       MY BOOKINGS
       ===================================================== */
    @Override
    public List<BookingResponse> getMyBookings(UUID userId) {

        return bookingRepository.findByUserId(userId)
                .stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    /* =====================================================
       RESCHEDULE
       ===================================================== */
    @Override
    public BookingResponse rescheduleBooking(
            UUID userId,
            UUID bookingId,
            RescheduleBookingRequest request
    ) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED ||
                booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Booking cannot be modified");
        }

        LocalDateTime newStart =
                LocalDateTime.parse(request.getScheduledAt());

        LocalDateTime newEnd =
                newStart.plusMinutes(
                        booking.getTotalDurationMinutes()
                );

        if (bookingRepository
                .existsOverlappingBookingExcludingSelf(
                        booking.getId(),
                        newStart,
                        newEnd)) {
            throw new RuntimeException("New slot unavailable");
        }

        booking.setScheduledAt(newStart);
        booking.setNote(request.getNote());
        booking.setStatus(BookingStatus.MODIFIED);
        booking.setBookedBy("MODIFIED_BY_SELF");

        bookingRepository.save(booking);
        return toBookingResponse(booking);
    }

    /* =====================================================
       CANCEL
       ===================================================== */
    @Override
    public BookingResponse cancelBooking(
            UUID userId,
            UUID bookingId
    ) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());

        bookingRepository.save(booking);
        return toBookingResponse(booking);
    }

    /* =====================================================
       MAPPERS
       ===================================================== */
    private BookingResponse toBookingResponse(Booking b) {

        BookingResponse dto = new BookingResponse();
        dto.setId(b.getId());
        dto.setUserId(b.getUser().getId());
        dto.setUserName(b.getUser().getName());
        dto.setPaymentId(
                b.getPayment() != null ? b.getPayment().getId() : null
        );
        dto.setCouponId(
                b.getCoupon() != null ? b.getCoupon().getId() : null
        );
        dto.setTotalAmount(b.getTotalAmount());
        dto.setPricePaid(b.getPricePaid());
        dto.setStatus(b.getStatus().name());
        dto.setScheduledAt(
                b.getScheduledAt() != null
                        ? b.getScheduledAt()
                        : null
        );
        dto.setNote(b.getNote());
        dto.setBookedBy(b.getBookedBy());

//        if (b.getBookingItems() != null) {
//            dto.setItems(
//                    b.getBookingItems().stream()
//                            .map(this::toItemResponse)
//                            .collect(Collectors.toList())
//            );
//        }

        return dto;
    }

    private BookingItemResponse toItemResponse(BookingItem item) {

        BookingItemResponse dto = new BookingItemResponse();
        dto.setId(item.getId());
        dto.setServiceId(item.getService().getId());
        dto.setServiceName(item.getServiceNameSnapshot());
        dto.setServicePrice(item.getServicePriceSnapshot());
        dto.setDuration(item.getServiceDurationSnapshot());
        dto.setStatus(item.getStatus().name());
        return dto;
    }

    @Override
    public BookingDetailsResponse getMyBookingById(
            UUID userId,
            UUID bookingId
    ) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // 🔒 Ownership check
        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return mapToDetailsResponse(booking);
    }

    /* ===============================
       Mapper
       =============================== */
    private BookingDetailsResponse mapToDetailsResponse(Booking booking) {

        BookingDetailsResponse dto = new BookingDetailsResponse();

        dto.setId(booking.getId());
        dto.setStatus(booking.getStatus().name());
        dto.setScheduledAt(
                booking.getScheduledAt() != null
                        ? booking.getScheduledAt().toString()
                        : null
        );
        dto.setBookedAt(
                booking.getCreatedAt() != null
                        ? booking.getCreatedAt().toString()
                        : null
        );
        dto.setBookedBy(booking.getBookedBy());

        dto.setTotalAmount(booking.getTotalAmount());
        dto.setPricePaid(booking.getPricePaid());

        dto.setCouponApplied(
                booking.getCoupon() != null
                        ? booking.getCoupon().getCode()
                        : null
        );

        dto.setItems(
                booking.getBookingItems()
                        .stream()
                        .map(this::mapItem)
                        .collect(Collectors.toList())
        );

        return dto;
    }

    private BookingItemDetailsResponse mapItem(BookingItem item) {
        BookingItemDetailsResponse dto = new BookingItemDetailsResponse();
        dto.setServiceName(item.getServiceNameSnapshot());
        dto.setPrice(item.getServicePriceSnapshot());
        dto.setDurationMinutes(item.getServiceDurationSnapshot());
        return dto;
    }
}
