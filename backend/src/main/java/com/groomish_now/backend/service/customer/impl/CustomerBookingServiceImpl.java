package com.groomish_now.backend.service.customer.impl;

import com.groomish_now.backend.dto.booking.*;
import com.groomish_now.backend.dto.mail.BookingEmailDto;
import com.groomish_now.backend.dto.product.BookingProductResponse;
import com.groomish_now.backend.dto.review.ServiceReviewResponse;
import com.groomish_now.backend.enums.NotificationType;
import com.groomish_now.backend.enums.PaymentMethod;
import com.groomish_now.backend.enums.PaymentStatus;
import com.groomish_now.backend.mapper.BookingMapper;
import com.groomish_now.backend.model.*;
import com.groomish_now.backend.repository.*;
import com.groomish_now.backend.service.booking.BookingTimelineService;
import com.groomish_now.backend.service.store.BranchCatalogService;
import com.groomish_now.backend.service.loyalty.LoyaltyConfigService;
import com.groomish_now.backend.service.utils.EmailService;
import com.groomish_now.backend.util.BookingCodeGenerator;
import com.groomish_now.backend.dto.booking.*;
import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.model.*;
import com.groomish_now.backend.repository.*;
import com.groomish_now.backend.service.customer.CustomerBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    private final BookingProductRepository bookingProductRepository;
    private final PaymentRepository paymentRepository;
    private final StoreRepository storeRepository;
    private final EmailService emailService;
    private final NotificationRepository notificationRepository;
    private final BookingTimelineService bookingTimelineService;
    private final BranchCatalogService branchCatalogService;
    private final ServiceReviewRepository reviewRepository;
    private final LoyaltyConfigService loyaltyConfigService;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final BookingMapper bookingMapper;

    /* =====================================================
       CREATE BOOKING
       ===================================================== */
    @Override
    public BookingResponse createBooking(UUID userId,
                                         CustomerCreateBookingRequest request) {

        List<UUID> serviceIds = request.getServiceIds();
        if (serviceIds == null || serviceIds.isEmpty()) {
            if (request.getServiceId() != null) {
                serviceIds = List.of(request.getServiceId());
            } else {
                throw new RuntimeException("Please select at least one service");
            }
        }

        if (request.getScheduledAt() == null) {
            throw new RuntimeException("Booking date/time is required");
        }
        if (request.getScheduledAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Selected appointment slot cannot be in the past. Please select an upcoming slot.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ServiceEntity> services = serviceRepository.findAllById(serviceIds);
        if (services.isEmpty()) {
            throw new RuntimeException("Selected services not found");
        }

        Store store = null;
        if (request.getStoreId() != null) {
            store = storeRepository.findById(request.getStoreId()).orElse(null);
        }
        if (store == null) {
            store = storeRepository.findAllByActiveTrueOrderByCreatedAtAsc().stream().findFirst().orElse(null);
        }

        if (store != null) {
            for (ServiceEntity s : services) {
                if (!branchCatalogService.isServiceAvailableAtStore(store.getId(), s.getId())) {
                    throw new RuntimeException("Service '" + s.getName() + "' is currently disabled or unavailable at " + store.getName() + ".");
                }
            }
        }

        double servicesTotal = services.stream().mapToDouble(ServiceEntity::getPrice).sum();
        int totalDuration = services.stream().mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0).sum();

        // Check 5-Staff Capacity at requested slot
        LocalDateTime reqStart = request.getScheduledAt();
        LocalDateTime reqEnd = reqStart.plusMinutes(totalDuration > 0 ? totalDuration : 30);
        List<Booking> dayBookings = bookingRepository.findBookingsForDate(reqStart.toLocalDate());
        int overlapCount = 0;
        for (Booking b : dayBookings) {
            if (b.getStatus() == BookingStatus.CANCELLED) continue;
            LocalDateTime bStart = b.getScheduledAt();
            if (bStart == null) continue;
            int bDur = b.getTotalDurationMinutes() != null && b.getTotalDurationMinutes() > 0 ? b.getTotalDurationMinutes() : 30;
            LocalDateTime bEnd = bStart.plusMinutes(bDur);
            if (bStart.isBefore(reqEnd) && bEnd.isAfter(reqStart)) {
                overlapCount++;
            }
        }
        if (overlapCount >= 5) {
            throw new RuntimeException("Selected time slot is fully booked across all 5 salon stylists");
        }

        Coupon coupon = null;
        double discount = 0.0;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            coupon = couponRepository
                    .findByCodeAndActiveTrue(request.getCouponCode())
                    .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

            if (!coupon.isActive()) {
                throw new RuntimeException("Coupon '" + coupon.getCode() + "' is inactive.");
            }
            if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Coupon '" + coupon.getCode() + "' has expired.");
            }
            if (coupon.getStartDate() != null && coupon.getStartDate().isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Coupon '" + coupon.getCode() + "' is not active yet (valid from " + coupon.getStartDate().toLocalDate() + ").");
            }
            if (coupon.getApplicableUserGroups() != null && !coupon.getApplicableUserGroups().isEmpty() && !coupon.getApplicableUserGroups().contains("ALL")) {
                java.util.Set<String> effectiveGroups = user.getAllEffectiveGroups();
                boolean matches = coupon.getApplicableUserGroups().stream()
                        .anyMatch(grp -> grp.equalsIgnoreCase("ALL") || effectiveGroups.contains(grp.toUpperCase().trim()));
                if (!matches) {
                    throw new RuntimeException("Coupon '" + coupon.getCode() + "' is exclusively reserved for members of: " + String.join(", ", coupon.getApplicableUserGroups()));
                }
            }
            final List<String> eligibleCats = coupon.getEligibleCategories();
            boolean hasSpecificCategories = eligibleCats != null && !eligibleCats.isEmpty()
                    && eligibleCats.stream().noneMatch(ec -> ec.trim().equalsIgnoreCase("ALL"));

            if (hasSpecificCategories) {
                double eligibleCategoryTotal = services.stream()
                        .filter(s -> s.getCategory() != null && eligibleCats.stream().anyMatch(ec ->
                                ec.trim().equalsIgnoreCase(s.getCategory().getName()) ||
                                (s.getCategory().getId() != null && ec.trim().equalsIgnoreCase(s.getCategory().getId().toString())) ||
                                s.getCategory().getName().toLowerCase().contains(ec.trim().toLowerCase()) ||
                                ec.trim().toLowerCase().contains(s.getCategory().getName().toLowerCase())
                        ))
                        .mapToDouble(s -> s.getPrice() != null ? s.getPrice() : 0.0)
                        .sum();

                boolean hasEligibleService = services.stream().anyMatch(s ->
                        s.getCategory() != null && eligibleCats.stream().anyMatch(ec ->
                                ec.trim().equalsIgnoreCase(s.getCategory().getName()) ||
                                (s.getCategory().getId() != null && ec.trim().equalsIgnoreCase(s.getCategory().getId().toString())) ||
                                s.getCategory().getName().toLowerCase().contains(ec.trim().toLowerCase()) ||
                                ec.trim().toLowerCase().contains(s.getCategory().getName().toLowerCase())
                        )
                );

                if (!hasEligibleService) {
                    throw new RuntimeException("Coupon '" + coupon.getCode() + "' is only valid for categories: " + String.join(", ", eligibleCats));
                }

                if (coupon.getMinAmount() != null && eligibleCategoryTotal < coupon.getMinAmount()) {
                    throw new RuntimeException("Combined total for eligible categories (" + String.join(", ", eligibleCats) + ") is ₹" + eligibleCategoryTotal + ", which does not meet coupon minimum of ₹" + coupon.getMinAmount());
                }

                discount = coupon.getDiscount() != null ? coupon.getDiscount() : 0.0;
                if (coupon.getMaxDiscount() != null && discount > coupon.getMaxDiscount()) {
                    discount = coupon.getMaxDiscount();
                }
                if (discount > eligibleCategoryTotal) {
                    discount = eligibleCategoryTotal;
                }
            } else {
                if (servicesTotal < (coupon.getMinAmount() != null ? coupon.getMinAmount() : 0.0)) {
                    throw new RuntimeException("Minimum amount for coupon is: ₹" + coupon.getMinAmount());
                }

                discount = coupon.getDiscount() != null ? coupon.getDiscount() : 0.0;
                if (coupon.getMaxDiscount() != null && discount > coupon.getMaxDiscount()) {
                    discount = coupon.getMaxDiscount();
                }
                if (discount > servicesTotal) {
                    discount = servicesTotal;
                }
            }
        }

        double finalPrice = Math.max(servicesTotal - discount, 0.0);

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setStore(store);
        if (store != null) {
            booking.setStoreNameSnapshot(store.getName());
            booking.setStoreAddressSnapshot(store.getAddress() + ", " + store.getCity());
        }
        booking.setBookingCode(BookingCodeGenerator.generateUniqueCode(bookingRepository));
        booking.setScheduledAt(request.getScheduledAt());
        booking.setNote(request.getNote());
        booking.setCoupon(coupon);
        booking.setTotalAmount(servicesTotal);
        booking.setPricePaid(finalPrice);
        booking.setBookedBy("BOOKED_BY_SELF");
        booking.setTotalDurationMinutes(totalDuration);

        // Create initial Payment record (Cash / Pay at Salon default)
        PaymentMethod method = PaymentMethod.CASH;
        PaymentStatus paymentStatus = PaymentStatus.PENDING;
        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            String pm = request.getPaymentMethod().toUpperCase();
            if (pm.contains("ONLINE") || pm.contains("RAZORPAY")) {
                method = PaymentMethod.ONLINE;
                paymentStatus = PaymentStatus.PENDING;
            } else if (pm.contains("UPI")) {
                method = PaymentMethod.UPI;
                paymentStatus = PaymentStatus.PENDING;
            } else if (pm.contains("CARD")) {
                method = PaymentMethod.CARD;
                paymentStatus = PaymentStatus.PENDING;
            }
        }

        // Pay at Salon (CASH) or completed payment -> CONFIRMED. Online payment pending -> PENDING.
        BookingStatus initialStatus = (method == PaymentMethod.CASH || paymentStatus == PaymentStatus.COMPLETED)
                ? BookingStatus.CONFIRMED
                : BookingStatus.PENDING;
        booking.setStatus(initialStatus);

        Payment payment = Payment.builder()
                .user(user)
                .amount(finalPrice)
                .paymentMethod(method)
                .paymentModeDetails(method == PaymentMethod.CASH ? "Pay at Salon" : "Online Payment (Razorpay)")
                .status(paymentStatus)
                .invoiceNumber("INV-GN-" + (System.currentTimeMillis() % 1000000))
                .paymentGatewayId("PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();
        paymentRepository.save(payment);
        booking.setPayment(payment);

        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "CREATED",
                initialStatus == BookingStatus.CONFIRMED ? "Appointment Confirmed" : "Appointment Reserved",
                initialStatus == BookingStatus.CONFIRMED
                        ? "Appointment booked and confirmed (" + (method == PaymentMethod.CASH ? "Pay at Salon" : "Payment Verified") + ") by " + user.getName() + " with " + services.size() + " service(s)."
                        : "Appointment booked by " + user.getName() + " with " + services.size() + " service(s). Awaiting online payment confirmation.",
                user.getName(),
                "CUSTOMER",
                user.getEmail()
        );

        List<BookingItem> items = new ArrayList<>();
        for (ServiceEntity service : services) {
            BookingItem item = new BookingItem();
            item.setBooking(booking);
            item.setService(service);
            item.setServiceNameSnapshot(service.getName());
            item.setServicePriceSnapshot(service.getPrice());
            item.setServiceDurationSnapshot(service.getDurationMinutes());
            item.setServiceRewardCoinsSnapshot(service.getRewards() != null ? service.getRewards() : 0);
            item.setStatus(initialStatus);
            items.add(bookingItemRepository.save(item));
        }
        booking.setBookingItems(items);

        // Snapshot expected reward points at booking creation
        double multiplier = 1.0;
        if (user.getTier() != null) {
            switch (user.getTier()) {
                case DIAMOND -> multiplier = 2.0;
                case PLATINUM -> multiplier = 1.5;
                case GOLD -> multiplier = 1.25;
                case SILVER -> multiplier = 1.0;
            }
        }
        double spendPerCoin = 100.0;
        try {
            if (loyaltyConfigService != null) {
                spendPerCoin = loyaltyConfigService.getOrCreateConfig().getSpendAmountPerCoin();
                if (spendPerCoin <= 0) spendPerCoin = 100.0;
            }
        } catch (Exception ignored) {}

        int baseCoins = (int) Math.round((finalPrice / spendPerCoin) * multiplier);
        int bonusCoins = items.stream()
                .mapToInt(i -> i.getServiceRewardCoinsSnapshot() != null ? i.getServiceRewardCoinsSnapshot() : 0)
                .sum();
        booking.setExpectedRewardPoints(Math.max(1, baseCoins + bonusCoins));
        booking = bookingRepository.save(booking);

        String serviceNames = services.stream().map(ServiceEntity::getName).collect(Collectors.joining(", "));

        // In-app Notification
        String notifMsg = initialStatus == BookingStatus.CONFIRMED
                ? "Your booking for " + serviceNames + " on " + booking.getScheduledAt() + " is confirmed. Booking ID: " + booking.getBookingCode()
                : "Your booking for " + serviceNames + " on " + booking.getScheduledAt() + " is reserved. Complete online payment to confirm your booking. Booking ID: " + booking.getBookingCode();
        Notification notification = Notification.builder()
                .user(user)
                .title(initialStatus == BookingStatus.CONFIRMED ? "Booking Confirmed" : "Booking Reserved")
                .message(notifMsg)
                .type(NotificationType.BOOKING)
                .referenceId(booking.getId())
                .link("/customer/bookings/" + booking.getId())
                .build();
        notificationRepository.save(notification);

        // Real-time Gmail Email (Sent only if booking is confirmed, e.g. Pay at Salon)
        if (initialStatus == BookingStatus.CONFIRMED) {
            BookingEmailDto emailDto = BookingEmailDto.fromBooking(booking);
            emailService.sendBookingConfirmationEmail(emailDto);
        }

        BookingResponse response = toBookingResponse(booking);
        ServiceEntity primaryService = services.get(0);
        response.setServiceId(primaryService.getId());
        response.setServiceName(serviceNames);
        return response;
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

            boolean dateActive = (coupon.getStartDate() == null || !coupon.getStartDate().isAfter(LocalDateTime.now())) &&
                    (coupon.getExpiryDate() == null || !coupon.getExpiryDate().isBefore(LocalDateTime.now()));
            boolean groupMatch = coupon.getApplicableUserGroups() == null || coupon.getApplicableUserGroups().isEmpty() ||
                    coupon.getApplicableUserGroups().contains("ALL") ||
                    coupon.getApplicableUserGroups().stream().anyMatch(g -> g.equalsIgnoreCase("ALL"));

            if (coupon.isActive() && dateActive && groupMatch) {
                final List<String> eligibleCats = coupon.getEligibleCategories();
                boolean hasSpecificCategories = eligibleCats != null && !eligibleCats.isEmpty()
                        && eligibleCats.stream().noneMatch(ec -> ec.trim().equalsIgnoreCase("ALL"));

                if (hasSpecificCategories) {
                    double eligibleCategoryTotal = services.stream()
                            .filter(s -> s.getCategory() != null && eligibleCats.stream().anyMatch(ec ->
                                    ec.trim().equalsIgnoreCase(s.getCategory().getName()) ||
                                    (s.getCategory().getId() != null && ec.trim().equalsIgnoreCase(s.getCategory().getId().toString())) ||
                                    s.getCategory().getName().toLowerCase().contains(ec.trim().toLowerCase()) ||
                                    ec.trim().toLowerCase().contains(s.getCategory().getName().toLowerCase())
                            ))
                            .mapToDouble(s -> s.getPrice() != null ? s.getPrice() : 0.0)
                            .sum();

                    boolean hasEligibleService = services.stream().anyMatch(s ->
                            s.getCategory() != null && eligibleCats.stream().anyMatch(ec ->
                                    ec.trim().equalsIgnoreCase(s.getCategory().getName()) ||
                                    (s.getCategory().getId() != null && ec.trim().equalsIgnoreCase(s.getCategory().getId().toString())) ||
                                    s.getCategory().getName().toLowerCase().contains(ec.trim().toLowerCase()) ||
                                    ec.trim().toLowerCase().contains(s.getCategory().getName().toLowerCase())
                            )
                    );

                    if (hasEligibleService && (coupon.getMinAmount() == null || eligibleCategoryTotal >= coupon.getMinAmount())) {
                        discount = coupon.getDiscount();
                        if (coupon.getMaxDiscount() != null && discount > coupon.getMaxDiscount()) {
                            discount = coupon.getMaxDiscount();
                        }
                        if (discount > eligibleCategoryTotal) {
                            discount = eligibleCategoryTotal;
                        }
                    } else {
                        discount = 0.0;
                    }
                } else if (totalAmount >= (coupon.getMinAmount() != null ? coupon.getMinAmount() : 0.0)) {
                    discount = coupon.getDiscount();
                    if (coupon.getMaxDiscount() != null && discount > coupon.getMaxDiscount()) {
                        discount = coupon.getMaxDiscount();
                    }
                    if (discount > totalAmount) {
                        discount = totalAmount;
                    }
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

        if (serviceId != null) {
            serviceRepository.findById(serviceId);
        }

        List<Booking> bookings =
                bookingRepository.findBookingsForDate(date);

        Map<String, Integer> slotCountMap = new HashMap<>();

        for (Booking b : bookings) {
            if (b.getStatus() == BookingStatus.CANCELLED) continue;
            LocalDateTime start = b.getScheduledAt();
            if (start == null) continue;
            int duration = b.getTotalDurationMinutes() != null && b.getTotalDurationMinutes() > 0 ? b.getTotalDurationMinutes() : 30;
            LocalDateTime end = start.plusMinutes(duration);

            LocalDateTime cursor = start;
            while (cursor.isBefore(end)) {
                String slotStr = String.format("%02d:%02d",
                        cursor.getHour(),
                        cursor.getMinute());
                slotCountMap.put(slotStr, slotCountMap.getOrDefault(slotStr, 0) + 1);
                cursor = cursor.plusMinutes(30);
            }
        }

        final int MAX_CONCURRENT_STAFF_SLOTS = 5;
        List<String> blockedSlots = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : slotCountMap.entrySet()) {
            if (entry.getValue() >= MAX_CONCURRENT_STAFF_SLOTS) {
                blockedSlots.add(entry.getKey());
            }
        }

        // Block past slots for current date
        if (date.isBefore(LocalDate.now())) {
            LocalTime slotCursor = LocalTime.of(9, 0);
            LocalTime salonClose = LocalTime.of(21, 0);
            while (slotCursor.isBefore(salonClose)) {
                blockedSlots.add(String.format("%02d:%02d", slotCursor.getHour(), slotCursor.getMinute()));
                slotCursor = slotCursor.plusMinutes(30);
            }
        } else if (date.isEqual(LocalDate.now())) {
            LocalTime nowTime = LocalTime.now();
            LocalTime slotCursor = LocalTime.of(9, 0);
            LocalTime salonClose = LocalTime.of(21, 0);
            while (slotCursor.isBefore(salonClose)) {
                if (!slotCursor.isAfter(nowTime)) {
                    String pastSlotStr = String.format("%02d:%02d", slotCursor.getHour(), slotCursor.getMinute());
                    if (!blockedSlots.contains(pastSlotStr)) {
                        blockedSlots.add(pastSlotStr);
                    }
                }
                slotCursor = slotCursor.plusMinutes(30);
            }
        }

        return new SlotAvailabilityResponse(blockedSlots);
    }

    /* =====================================================
       MY BOOKINGS
       ===================================================== */
    @Override
    public List<BookingResponse> getMyBookings(UUID userId) {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        return bookingRepository.findByUserId(userId)
                .stream()
                .sorted((a, b) -> {
                    int bucketA = getBookingSortBucket(a, today, now);
                    int bucketB = getBookingSortBucket(b, today, now);
                    if (bucketA != bucketB) {
                        return Integer.compare(bucketA, bucketB);
                    }
                    LocalDateTime timeA = a.getScheduledAt() != null ? a.getScheduledAt() : (a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN);
                    LocalDateTime timeB = b.getScheduledAt() != null ? b.getScheduledAt() : (b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN);

                    // Bucket 1 (Today): earliest time today first (chronological ASC)
                    if (bucketA == 1) {
                        return timeA.compareTo(timeB);
                    }
                    // Bucket 2 (Upcoming): nearest upcoming date first (chronological ASC)
                    if (bucketA == 2) {
                        return timeA.compareTo(timeB);
                    }
                    // Bucket 3 (Completed / Cancelled / Past): latest to old (DESC)
                    return timeB.compareTo(timeA);
                })
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    private int getBookingSortBucket(Booking b, LocalDate today, LocalDateTime now) {
        BookingStatus status = b.getStatus();
        if (status == BookingStatus.COMPLETED || status == BookingStatus.CANCELLED) {
            return 3;
        }
        if (b.getScheduledAt() == null) {
            return 3;
        }
        if (b.getScheduledAt().toLocalDate().isEqual(today)) {
            return 1;
        }
        if (b.getScheduledAt().isAfter(now)) {
            return 2;
        }
        return 3;
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

        // 🔒 Strict Ownership check: Customer can only modify their own booking
        if (!isBookingOwner(booking, userId)) {
            throw new RuntimeException("Access denied: You are only authorized to reschedule your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED ||
                booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Booking cannot be modified in " + booking.getStatus() + " status");
        }

        if (booking.getScheduledAt() != null && booking.getScheduledAt().plusHours(2).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("The 2-hour window after your scheduled appointment has expired. This booking can no longer be rescheduled.");
        }

        LocalDateTime newStart = LocalDateTime.parse(request.getScheduledAt());
        if (newStart.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Selected appointment slot cannot be in the past. Please select an upcoming slot.");
        }
        int dur = booking.getTotalDurationMinutes() != null && booking.getTotalDurationMinutes() > 0 ? booking.getTotalDurationMinutes() : 30;
        LocalDateTime newEnd = newStart.plusMinutes(dur);

        List<Booking> dayBookings = bookingRepository.findBookingsForDate(newStart.toLocalDate());
        int overlappingCount = 0;
        for (Booking b : dayBookings) {
            if (b.getId().equals(booking.getId()) || b.getStatus() == BookingStatus.CANCELLED) continue;
            LocalDateTime bStart = b.getScheduledAt();
            if (bStart == null) continue;
            int bDuration = b.getTotalDurationMinutes() != null && b.getTotalDurationMinutes() > 0 ? b.getTotalDurationMinutes() : 30;
            LocalDateTime bEnd = bStart.plusMinutes(bDuration);
            if (bStart.isBefore(newEnd) && bEnd.isAfter(newStart)) {
                overlappingCount++;
            }
        }
        if (overlappingCount >= 5) {
            throw new RuntimeException("New slot unavailable - all 5 salon stylist slots are fully booked");
        }

        booking.setScheduledAt(newStart);
        booking.setNote(request.getNote());
        booking.setStatus(BookingStatus.MODIFIED);
        booking.setBookedBy("MODIFIED_BY_SELF");
        booking.setReminderOneHourSent(false);
        booking.setReminderStartSent(false);
        booking.setWarningPostOneHourSent(false);
        booking.setAutoCancelled(false);

        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "RESCHEDULED",
                "Booking Rescheduled by Client",
                "Client rescheduled booking to " + newStart + (request.getNote() != null ? ". Note: " + request.getNote() : "."),
                booking.getUser() != null ? booking.getUser().getName() : "Customer",
                "CUSTOMER",
                booking.getUser() != null ? booking.getUser().getEmail() : null
        );

        // In-app Notification
        Notification rescheduleNotif = Notification.builder()
                .user(booking.getUser())
                .title("Booking Rescheduled")
                .message("Your booking has been rescheduled to " + newStart + ". Booking ID: " + (booking.getBookingCode() != null ? booking.getBookingCode() : booking.getId().toString()))
                .type(NotificationType.BOOKING)
                .referenceId(booking.getId())
                .link("/customer/bookings/" + booking.getId())
                .build();
        notificationRepository.save(rescheduleNotif);

        // Real-time Email
        BookingEmailDto emailDto = BookingEmailDto.fromBooking(saved);
        emailService.sendBookingModifiedEmail(emailDto, false);

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

        // 🔒 Strict Ownership check: Customer can only cancel their own booking
        if (!isBookingOwner(booking, userId)) {
            throw new RuntimeException("Access denied: You are only authorized to cancel your own bookings");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        List<BookingItem> items = bookingItemRepository.findByBookingId(booking.getId());
        if (items != null) {
            items.forEach(bi -> bi.setStatus(BookingStatus.CANCELLED));
            bookingItemRepository.saveAll(items);
        }
        if (booking.getPayment() != null) {
            Payment p = booking.getPayment();
            if (p.getStatus() == PaymentStatus.PENDING ||
                p.getPaymentMethod() == PaymentMethod.CASH) {
                p.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(p);
            }
        }

        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "CANCELLED",
                "Appointment Cancelled by Client",
                "Client cancelled the appointment.",
                booking.getUser() != null ? booking.getUser().getName() : "Customer",
                "CUSTOMER",
                booking.getUser() != null ? booking.getUser().getEmail() : null
        );

        String displayCode = booking.getBookingCode() != null ? booking.getBookingCode() : booking.getId().toString();

        // In-app Notification
        Notification cancelNotif = Notification.builder()
                .user(booking.getUser())
                .title("Appointment Cancelled")
                .message("Your appointment (ID: " + displayCode + ") has been cancelled.")
                .type(NotificationType.BOOKING)
                .referenceId(booking.getId())
                .link("/customer/bookings/" + booking.getId())
                .build();
        notificationRepository.save(cancelNotif);

        // Real-time Email
        String sName = (booking.getBookingItems() != null && !booking.getBookingItems().isEmpty())
                ? booking.getBookingItems().get(0).getServiceNameSnapshot() : "Salon Appointment";
        emailService.sendBookingStatusEmail(
                booking.getUser().getEmail(),
                booking.getUser().getName(),
                displayCode,
                sName,
                "CANCELLED",
                "Your appointment has been cancelled as requested."
        );

        return toBookingResponse(booking);
    }

    /* =====================================================
       MAPPERS
       ===================================================== */
    private BookingResponse toBookingResponse(Booking b) {
        return bookingMapper.toBookingResponse(b);
    }

    private boolean isBookingOwner(Booking booking, UUID userId) {
        return booking != null && booking.getUser() != null && booking.getUser().getId().equals(userId);
    }

    @Override
    public BookingDetailsResponse getMyBookingById(
            UUID userId,
            UUID bookingId
    ) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // 🔒 Strict Ownership check: Customers can ONLY view their own bookings
        if (!isBookingOwner(booking, userId)) {
            throw new RuntimeException("Access denied: You are only authorized to view your own bookings");
        }

        return mapToDetailsResponse(booking);
    }

    @Override
    public BookingDetailsResponse getMyBookingByIdOrCode(
            UUID userId,
            String identifier
    ) {
        Booking booking = null;
        try {
            UUID bookingId = UUID.fromString(identifier);
            booking = bookingRepository.findById(bookingId).orElse(null);
        } catch (IllegalArgumentException ignored) {
            // Not a UUID, try by bookingCode
        }

        if (booking == null) {
            String trimmed = identifier.trim();
            booking = bookingRepository.findByBookingCodeIgnoreCase(trimmed)
                    .or(() -> bookingRepository.findFirstByBookingCodeStartingWithIgnoreCase(trimmed))
                    .orElseThrow(() -> new RuntimeException("Booking not found: " + identifier));
        }

        // 🔒 Strict Ownership check: Customers can ONLY view their own bookings
        if (!isBookingOwner(booking, userId)) {
            throw new RuntimeException("Access denied: You are only authorized to view your own bookings");
        }

        return mapToDetailsResponse(booking);
    }

    /* =====================================================
       ADD SERVICE TO EXISTING BOOKING (CUSTOMER)
       ===================================================== */
    @Override
    public BookingDetailsResponse addServiceToBooking(
            UUID userId,
            UUID bookingId,
            UUID serviceId
    ) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!isBookingOwner(booking, userId)) {
            throw new RuntimeException("Access denied: You are only authorized to modify your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Booking cannot be modified in " + booking.getStatus() + " status");
        }

        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        if (booking.getStore() != null && !branchCatalogService.isServiceAvailableAtStore(booking.getStore().getId(), service.getId())) {
            throw new RuntimeException("Service '" + service.getName() + "' is currently disabled or unavailable at " + booking.getStore().getName() + ".");
        }

        BookingItem item = new BookingItem();
        item.setBooking(booking);
        item.setService(service);
        item.setServiceNameSnapshot(service.getName());
        item.setServicePriceSnapshot(service.getPrice());
        item.setServiceDurationSnapshot(service.getDurationMinutes());
        item.setServiceRewardCoinsSnapshot(service.getRewards() != null ? service.getRewards() : 0);
        item.setStatus(booking.getStatus());
        bookingItemRepository.save(item);

        if (booking.getBookingItems() == null) {
            booking.setBookingItems(new ArrayList<>());
        }
        booking.getBookingItems().add(item);

        recalculateBookingTotals(booking);
        booking.setStatus(BookingStatus.MODIFIED);
        booking.setBookedBy("MODIFIED_BY_SELF");
        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "SERVICE_ADDED",
                "Service Added by Client",
                "Client added " + service.getName() + " (₹" + service.getPrice() + ") to appointment.",
                booking.getUser() != null ? booking.getUser().getName() : "Customer",
                "CUSTOMER",
                booking.getUser() != null ? booking.getUser().getEmail() : null
        );

        // In-app Notification
        String displayCode = booking.getBookingCode() != null ? booking.getBookingCode() : "GN-" + booking.getId().toString().substring(0, 8).toUpperCase();
        Notification notif = Notification.builder()
                .user(booking.getUser())
                .title("Service Added to Booking")
                .message(service.getName() + " has been added to your appointment (" + displayCode + ").")
                .type(NotificationType.BOOKING)
                .referenceId(booking.getId())
                .link("/customer/bookings/" + booking.getId())
                .build();
        notificationRepository.save(notif);

        return mapToDetailsResponse(booking);
    }

    /* =====================================================
       REMOVE SERVICE FROM EXISTING BOOKING (CUSTOMER)
       ===================================================== */
    @Override
    public BookingDetailsResponse removeServiceFromBooking(
            UUID userId,
            UUID bookingId,
            UUID itemId
    ) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!isBookingOwner(booking, userId)) {
            throw new RuntimeException("Access denied: You are only authorized to modify your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Booking cannot be modified in " + booking.getStatus() + " status");
        }

        if (booking.getBookingItems() == null || booking.getBookingItems().size() <= 1) {
            throw new RuntimeException("Cannot remove the only service in this appointment. Please cancel the booking instead.");
        }

        BookingItem itemToRemove = booking.getBookingItems().stream()
                .filter(it -> it.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Service item not found in booking"));

        String removedServiceName = itemToRemove.getServiceNameSnapshot();
        booking.getBookingItems().remove(itemToRemove);
        bookingItemRepository.delete(itemToRemove);

        recalculateBookingTotals(booking);
        booking.setStatus(BookingStatus.MODIFIED);
        booking.setBookedBy("MODIFIED_BY_SELF");
        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "SERVICE_REMOVED",
                "Service Removed by Client",
                "Client removed " + removedServiceName + " from appointment.",
                booking.getUser() != null ? booking.getUser().getName() : "Customer",
                "CUSTOMER",
                booking.getUser() != null ? booking.getUser().getEmail() : null
        );

        // In-app Notification
        String displayCode = booking.getBookingCode() != null ? booking.getBookingCode() : "GN-" + booking.getId().toString().substring(0, 8).toUpperCase();
        Notification notif = Notification.builder()
                .user(booking.getUser())
                .title("Service Removed from Booking")
                .message(removedServiceName + " has been removed from your appointment (" + displayCode + ").")
                .type(NotificationType.BOOKING)
                .referenceId(booking.getId())
                .link("/customer/bookings/" + booking.getId())
                .build();
        notificationRepository.save(notif);

        return mapToDetailsResponse(booking);
    }

    private void recalculateBookingTotals(Booking booking) {
        double servicesTotal = 0.0;
        int totalDuration = 0;
        if (booking.getBookingItems() != null) {
            for (BookingItem item : booking.getBookingItems()) {
                if (item.getServicePriceSnapshot() != null) {
                    servicesTotal += item.getServicePriceSnapshot();
                }
                if (item.getServiceDurationSnapshot() != null) {
                    totalDuration += item.getServiceDurationSnapshot();
                }
            }
        }

        double productsTotal = 0.0;
        List<BookingProduct> bProducts = bookingProductRepository.findByBookingId(booking.getId());
        if (bProducts != null) {
            for (BookingProduct bp : bProducts) {
                if (bp.getTotalPrice() != null) {
                    productsTotal += bp.getTotalPrice();
                }
            }
        }

        double totalAmount = servicesTotal + productsTotal;
        double discount = 0.0;
        if (booking.getCoupon() != null) {
            Coupon coupon = booking.getCoupon();
            if (coupon.isActive() && !coupon.getExpiryDate().isBefore(LocalDateTime.now()) && totalAmount >= (coupon.getMinAmount() != null ? coupon.getMinAmount() : 0.0)) {
                discount = coupon.getDiscount() != null ? coupon.getDiscount() : 0.0;
                if (coupon.getMaxDiscount() != null && discount > coupon.getMaxDiscount()) {
                    discount = coupon.getMaxDiscount();
                }
            }
        }

        double finalAmount = Math.max(0.0, totalAmount - discount);
        booking.setTotalAmount(finalAmount);

        // Preserve already confirmed paid amount (e.g. online payment received previously)
        // Never increase pricePaid when new items are added without a corresponding payment
        double currentPaid = booking.getPricePaid() != null ? booking.getPricePaid() : 0.0;
        if (booking.getPayment() != null && booking.getPayment().getStatus() == com.groomish_now.backend.enums.PaymentStatus.COMPLETED) {
            double confirmed = booking.getPayment().getAmount() != null ? booking.getPayment().getAmount() : currentPaid;
            booking.setPricePaid(Math.min(confirmed, finalAmount));
        } else if (booking.getPayment() != null && booking.getPayment().getStatus() == com.groomish_now.backend.enums.PaymentStatus.PENDING) {
            if (booking.getStatus() != BookingStatus.COMPLETED) {
                booking.setPricePaid(0.0);
            }
        } else {
            booking.setPricePaid(Math.min(currentPaid, finalAmount));
        }
        booking.setTotalDurationMinutes(totalDuration);

        // Recalculate snapshot expected reward points based on item snapshots (never live catalog)
        double multiplier = 1.0;
        if (booking.getUser() != null && booking.getUser().getTier() != null) {
            switch (booking.getUser().getTier()) {
                case DIAMOND -> multiplier = 2.0;
                case PLATINUM -> multiplier = 1.5;
                case GOLD -> multiplier = 1.25;
                case SILVER -> multiplier = 1.0;
            }
        }
        double spendPerCoin = 100.0;
        try {
            if (loyaltyConfigService != null) {
                spendPerCoin = loyaltyConfigService.getOrCreateConfig().getSpendAmountPerCoin();
                if (spendPerCoin <= 0) spendPerCoin = 100.0;
            }
        } catch (Exception ignored) {}

        int baseCoins = (int) Math.round((finalAmount / spendPerCoin) * multiplier);
        int bonusCoins = 0;
        if (booking.getBookingItems() != null) {
            bonusCoins = booking.getBookingItems().stream()
                    .mapToInt(i -> i.getServiceRewardCoinsSnapshot() != null ? i.getServiceRewardCoinsSnapshot() : 0)
                    .sum();
        }
        booking.setExpectedRewardPoints(Math.max(1, baseCoins + bonusCoins));
    }

    /* ===============================
       Mapper
       =============================== */
    private BookingDetailsResponse mapToDetailsResponse(Booking booking) {

        BookingDetailsResponse dto = new BookingDetailsResponse();

        dto.setId(booking.getId());
        dto.setBookingCode(booking.getBookingCode() != null ? booking.getBookingCode() : "GN-" + booking.getId().toString().substring(0, 8).toUpperCase());
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

        if (booking.getStore() != null) {
            dto.setStoreId(booking.getStore().getId());
            dto.setStoreName(booking.getStoreNameSnapshot() != null ? booking.getStoreNameSnapshot() : booking.getStore().getName());
            dto.setStoreAddress(booking.getStoreAddressSnapshot() != null ? booking.getStoreAddressSnapshot() : booking.getStore().getAddress());
            dto.setStoreLatitude(booking.getStore().getLatitude());
            dto.setStoreLongitude(booking.getStore().getLongitude());
        } else if (booking.getStoreNameSnapshot() != null) {
            dto.setStoreName(booking.getStoreNameSnapshot());
            dto.setStoreAddress(booking.getStoreAddressSnapshot());
        }

        Double totalAmount = booking.getTotalAmount();
        Double pricePaid = booking.getPricePaid();
        if ((totalAmount == null || totalAmount == 0.0) && booking.getBookingItems() != null && !booking.getBookingItems().isEmpty()) {
            totalAmount = booking.getBookingItems().stream()
                    .mapToDouble(it -> it.getServicePriceSnapshot() != null && it.getServicePriceSnapshot() > 0 ? it.getServicePriceSnapshot()
                            : (it.getService() != null && it.getService().getPrice() != null ? it.getService().getPrice() : 0.0))
                    .sum();
        }
        if (totalAmount == null) totalAmount = 0.0;

        if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.COMPLETED) {
            if (pricePaid == null || pricePaid == 0.0) {
                pricePaid = booking.getPayment().getAmount() != null ? booking.getPayment().getAmount() : totalAmount;
            }
        } else if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.PENDING) {
            if (booking.getStatus() != BookingStatus.COMPLETED) {
                pricePaid = 0.0;
            }
        }
        if (pricePaid == null) pricePaid = 0.0;
        pricePaid = Math.min(pricePaid, totalAmount);
        Double remainingAmount = Math.max(0.0, totalAmount - pricePaid);

        dto.setTotalAmount(totalAmount);
        dto.setPricePaid(pricePaid);
        dto.setRemainingAmount(remainingAmount);

        dto.setCouponApplied(
                booking.getCoupon() != null
                        ? booking.getCoupon().getCode()
                        : null
        );

        if (booking.getPayment() != null) {
            dto.setPaymentId(booking.getPayment().getId());
            dto.setPaymentMethod(booking.getPayment().getPaymentMethod() != null ? booking.getPayment().getPaymentMethod().name() : "CASH");
            if (booking.getStatus() == BookingStatus.CANCELLED) {
                if (booking.getPayment().getPaymentMethod() == PaymentMethod.CASH ||
                    booking.getPayment().getStatus() == PaymentStatus.PENDING) {
                    dto.setPaymentStatus("CANCELLED");
                } else {
                    dto.setPaymentStatus(booking.getPayment().getStatus().name());
                }
            } else if (booking.getStatus() == BookingStatus.COMPLETED || (remainingAmount <= 0.01 && pricePaid > 0)) {
                dto.setPaymentStatus("COMPLETED");
            } else if (pricePaid > 0.01 && remainingAmount > 0.01) {
                dto.setPaymentStatus("PARTIALLY_PAID");
            } else {
                dto.setPaymentStatus(booking.getPayment().getStatus() != null ? booking.getPayment().getStatus().name() : "PENDING");
            }
            dto.setInvoiceNumber(booking.getPayment().getInvoiceNumber());
        } else {
            dto.setPaymentMethod("CASH");
            if (booking.getStatus() == BookingStatus.COMPLETED || (remainingAmount <= 0.01 && pricePaid > 0)) {
                dto.setPaymentStatus("COMPLETED");
            } else if (booking.getStatus() == BookingStatus.CANCELLED) {
                dto.setPaymentStatus("CANCELLED");
            } else if (pricePaid > 0.01 && remainingAmount > 0.01) {
                dto.setPaymentStatus("PARTIALLY_PAID");
            } else {
                dto.setPaymentStatus("PENDING");
            }
        }

        dto.setExpectedRewardPoints(resolveBookingPoints(booking, dto.getPricePaid()));
        dto.setPointsConfirmed(booking.getStatus() == BookingStatus.COMPLETED);
        dto.setCheckedInAt(booking.getCheckedInAt() != null ? booking.getCheckedInAt().toString() : null);
        dto.setCompletedAt(booking.getCompletedAt() != null ? booking.getCompletedAt().toString() : null);
        dto.setCancelledAt(booking.getCancelledAt() != null ? booking.getCancelledAt().toString() : null);

        if (booking.getScheduledAt() != null &&
            booking.getStatus() != BookingStatus.CANCELLED &&
            booking.getStatus() != BookingStatus.COMPLETED &&
            booking.getStatus() != BookingStatus.CHECKED_IN &&
            booking.getStatus() != BookingStatus.IN_PROGRESS &&
            booking.getCheckedInAt() == null) {
            LocalDateTime deadline = booking.getScheduledAt().plusHours(2);
            if (LocalDateTime.now().isAfter(booking.getScheduledAt())) {
                long mins = java.time.Duration.between(LocalDateTime.now(), deadline).toMinutes();
                dto.setGraceMinutesRemaining(Math.max(0, mins));
            } else {
                dto.setGraceMinutesRemaining(null);
            }
        }
        dto.setWarning1HourSent(booking.getWarningPostOneHourSent());

        if (booking.getBookingItems() != null) {
            dto.setItems(
                    booking.getBookingItems()
                            .stream()
                            .map(this::mapItem)
                            .collect(Collectors.toList())
            );
        } else {
            dto.setItems(new ArrayList<>());
        }

        List<BookingProduct> prods = bookingProductRepository.findByBookingId(booking.getId());
        if (prods != null && !prods.isEmpty()) {
            dto.setProducts(prods.stream().map(bp -> BookingProductResponse.builder()
                    .id(bp.getId())
                    .productId(bp.getProduct() != null ? bp.getProduct().getId() : null)
                    .productName(bp.getProductNameSnapshot())
                    .brand(bp.getProduct() != null ? bp.getProduct().getBrand() : null)
                    .volumeOrSize(bp.getProduct() != null ? bp.getProduct().getVolumeOrSize() : null)
                    .image(bp.getProduct() != null ? bp.getProduct().getImage() : null)
                    .unitPrice(bp.getUnitPriceSnapshot())
                    .mrp(bp.getProduct() != null && bp.getProduct().getMrp() != null ? bp.getProduct().getMrp() : bp.getUnitPriceSnapshot())
                    .quantity(bp.getQuantity())
                    .totalPrice(bp.getTotalPrice())
                    .build()).collect(Collectors.toList()));
        } else {
            dto.setProducts(new ArrayList<>());
        }

        if (booking.getUser() != null) {
            List<ServiceReview> reviews = reviewRepository.findByUserIdAndBookingId(booking.getUser().getId(), booking.getId());
            if (reviews != null && !reviews.isEmpty()) {
                dto.setCustomerReviews(reviews.stream().map(r -> ServiceReviewResponse.builder()
                        .id(r.getId())
                        .serviceId(r.getService() != null ? r.getService().getId() : null)
                        .serviceName(r.getService() != null ? r.getService().getName() : null)
                        .productId(r.getProduct() != null ? r.getProduct().getId() : null)
                        .productName(r.getProduct() != null ? r.getProduct().getName() : null)
                        .bookingId(r.getBooking() != null ? r.getBooking().getId() : null)
                        .userId(r.getUser() != null ? r.getUser().getId() : null)
                        .userName(r.getUser() != null ? r.getUser().getName() : "Customer")
                        .userImage(r.getUser() != null ? r.getUser().getImage() : null)
                        .rating(r.getRating())
                        .review(r.getReview())
                        .createdAt(r.getCreatedAt())
                        .build()).collect(Collectors.toList()));
            } else {
                dto.setCustomerReviews(new ArrayList<>());
            }
        } else {
            dto.setCustomerReviews(new ArrayList<>());
        }

        dto.setTimeline(bookingTimelineService.getTimelineForBooking(booking));

        return dto;
    }

    private BookingItemDetailsResponse mapItem(BookingItem item) {
        BookingItemDetailsResponse dto = new BookingItemDetailsResponse();
        dto.setId(item.getId());
        dto.setServiceId(item.getService() != null ? item.getService().getId() : null);
        String name = item.getServiceNameSnapshot() != null ? item.getServiceNameSnapshot() : (item.getService() != null ? item.getService().getName() : "Salon Service");
        dto.setServiceName(name);
        Double itemPrice = item.getServicePriceSnapshot();
        if ((itemPrice == null || itemPrice == 0.0) && item.getService() != null && item.getService().getPrice() != null) {
            itemPrice = item.getService().getPrice();
        }
        dto.setPrice(itemPrice != null ? itemPrice : 0.0);

        Double subMrp = null;
        if (item.getService() != null && item.getService().getSubServices() != null) {
            for (SubService sub : item.getService().getSubServices()) {
                if (sub.getName() != null && name.toLowerCase().contains(sub.getName().toLowerCase())) {
                    if (sub.getMrp() != null && sub.getMrp() > 0) {
                        subMrp = sub.getMrp();
                    }
                    break;
                }
            }
        }
        double uMrp = subMrp != null ? subMrp
                : (item.getService() != null && item.getService().getMrp() != null && item.getService().getMrp() > 0
                        ? item.getService().getMrp()
                        : dto.getPrice());
        if (uMrp < dto.getPrice()) {
            uMrp = dto.getPrice();
        }
        dto.setMrp(uMrp);

        dto.setDurationMinutes(item.getServiceDurationSnapshot());
        dto.setRewardCoins(item.getServiceRewardCoinsSnapshot() != null ? item.getServiceRewardCoinsSnapshot() : 0);
        dto.setImage(item.getService() != null ? item.getService().getImage() : null);
        if ((item.getBooking() != null && item.getBooking().getStatus() == BookingStatus.CANCELLED)
                || item.getStatus() == BookingStatus.CANCELLED) {
            dto.setStatus("CANCELLED");
        } else {
            dto.setStatus(item.getStatus() != null ? item.getStatus().name() : null);
        }
        return dto;
    }

    private int resolveBookingPoints(Booking b, Double pricePaid) {
        int resolvedPoints = 0;
        if (b.getStatus() == BookingStatus.COMPLETED) {
            List<PointsLedger> ledgers = pointsLedgerRepository.findByRelatedId(b.getId());
            if (ledgers != null && !ledgers.isEmpty()) {
                resolvedPoints = ledgers.stream()
                        .mapToInt(l -> l.getChangeAmount() != null ? l.getChangeAmount() : 0)
                        .sum();
            }
        }
        if (resolvedPoints <= 0 && b.getExpectedRewardPoints() != null && b.getExpectedRewardPoints() > 0) {
            resolvedPoints = b.getExpectedRewardPoints();
        }
        if (resolvedPoints <= 0) {
            double pAmount = pricePaid != null ? pricePaid : (b.getPricePaid() != null ? b.getPricePaid() : 0.0);
            double multiplier = 1.0;
            if (b.getUser() != null && b.getUser().getTier() != null) {
                switch (b.getUser().getTier()) {
                    case DIAMOND -> multiplier = 2.0;
                    case PLATINUM -> multiplier = 1.5;
                    case GOLD -> multiplier = 1.25;
                    case SILVER -> multiplier = 1.0;
                }
            }
            double spendPerCoin = 100.0;
            try {
                if (loyaltyConfigService != null) {
                    spendPerCoin = loyaltyConfigService.getOrCreateConfig().getSpendAmountPerCoin();
                    if (spendPerCoin <= 0) spendPerCoin = 100.0;
                }
            } catch (Exception ignored) {}

            int baseCoins = (int) Math.round((pAmount / spendPerCoin) * multiplier);
            int bonusCoins = 0;
            if (b.getBookingItems() != null) {
                bonusCoins = b.getBookingItems().stream()
                        .mapToInt(i -> i.getServiceRewardCoinsSnapshot() != null ? i.getServiceRewardCoinsSnapshot() : 0)
                        .sum();
            }
            resolvedPoints = Math.max(1, baseCoins + bonusCoins);
            b.setExpectedRewardPoints(resolvedPoints);
            bookingRepository.save(b);
        }
        return resolvedPoints;
    }
}
