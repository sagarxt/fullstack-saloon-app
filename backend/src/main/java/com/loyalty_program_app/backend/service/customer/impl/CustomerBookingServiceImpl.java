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
    private final com.loyalty_program_app.backend.service.utils.EmailService emailService;
    private final NotificationRepository notificationRepository;
    private final com.loyalty_program_app.backend.service.BookingTimelineService bookingTimelineService;
    private final com.loyalty_program_app.backend.service.BranchCatalogService branchCatalogService;

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

            if (coupon.isActive() && !coupon.getExpiryDate().isBefore(LocalDateTime.now()) && servicesTotal >= (coupon.getMinAmount() != null ? coupon.getMinAmount() : 0.0)) {
                discount = coupon.getDiscount() != null ? coupon.getDiscount() : 0.0;
                if (coupon.getMaxDiscount() != null && discount > coupon.getMaxDiscount()) {
                    discount = coupon.getMaxDiscount();
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
        booking.setBookingCode(com.loyalty_program_app.backend.util.BookingCodeGenerator.generateUniqueCode(bookingRepository));
        booking.setScheduledAt(request.getScheduledAt());
        booking.setNote(request.getNote());
        booking.setCoupon(coupon);
        booking.setTotalAmount(servicesTotal);
        booking.setPricePaid(finalPrice);
        booking.setStatus(BookingStatus.PENDING);
        booking.setBookedBy("BOOKED_BY_SELF");
        booking.setTotalDurationMinutes(totalDuration);

        // Create initial Payment record (Cash / Pay at Salon default)
        com.loyalty_program_app.backend.enums.PaymentMethod method = com.loyalty_program_app.backend.enums.PaymentMethod.CASH;
        com.loyalty_program_app.backend.enums.PaymentStatus paymentStatus = com.loyalty_program_app.backend.enums.PaymentStatus.PENDING;
        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            String pm = request.getPaymentMethod().toUpperCase();
            if (pm.contains("UPI")) {
                method = com.loyalty_program_app.backend.enums.PaymentMethod.UPI;
                paymentStatus = com.loyalty_program_app.backend.enums.PaymentStatus.COMPLETED;
            } else if (pm.contains("CARD")) {
                method = com.loyalty_program_app.backend.enums.PaymentMethod.CARD;
                paymentStatus = com.loyalty_program_app.backend.enums.PaymentStatus.COMPLETED;
            }
        }

        Payment payment = Payment.builder()
                .user(user)
                .amount(finalPrice)
                .paymentMethod(method)
                .paymentModeDetails(method == com.loyalty_program_app.backend.enums.PaymentMethod.CASH ? "Pay at Salon" : method.name())
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
                "Appointment Created",
                "Appointment booked by " + user.getName() + " with " + services.size() + " service(s).",
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
            item.setStatus(BookingStatus.PENDING);
            items.add(bookingItemRepository.save(item));
        }
        booking.setBookingItems(items);

        String serviceNames = services.stream().map(ServiceEntity::getName).collect(Collectors.joining(", "));

        // In-app Notification
        Notification notification = Notification.builder()
                .user(user)
                .title("Appointment Booked")
                .message("Your appointment for " + serviceNames + " on " + booking.getScheduledAt() + " is confirmed. Booking ID: " + booking.getBookingCode())
                .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
                .build();
        notificationRepository.save(notification);

        // Real-time Gmail Email
        emailService.sendBookingConfirmationEmail(
                user.getEmail(),
                user.getName(),
                booking.getBookingCode() != null ? booking.getBookingCode() : booking.getId().toString(),
                serviceNames,
                booking.getScheduledAt(),
                booking.getPricePaid()
        );

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
                "Appointment Rescheduled by Client",
                "Client rescheduled appointment to " + newStart + (request.getNote() != null ? ". Note: " + request.getNote() : "."),
                booking.getUser() != null ? booking.getUser().getName() : "Customer",
                "CUSTOMER",
                booking.getUser() != null ? booking.getUser().getEmail() : null
        );

        // In-app Notification
        Notification rescheduleNotif = Notification.builder()
                .user(booking.getUser())
                .title("Appointment Rescheduled")
                .message("Your appointment has been rescheduled to " + newStart + ".")
                .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
                .build();
        notificationRepository.save(rescheduleNotif);

        // Real-time Email
        String sName = (booking.getBookingItems() != null && !booking.getBookingItems().isEmpty())
                ? booking.getBookingItems().get(0).getServiceNameSnapshot() : "Salon Appointment";
        String displayCode = booking.getBookingCode() != null ? booking.getBookingCode() : booking.getId().toString();
        emailService.sendBookingStatusEmail(
                booking.getUser().getEmail(),
                booking.getUser().getName(),
                displayCode,
                sName,
                "RESCHEDULED",
                "Your appointment has been rescheduled to " + newStart
        );

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
        if (booking.getPayment() != null) {
            Payment p = booking.getPayment();
            if (p.getStatus() == com.loyalty_program_app.backend.enums.PaymentStatus.PENDING ||
                p.getPaymentMethod() == com.loyalty_program_app.backend.enums.PaymentMethod.CASH) {
                p.setStatus(com.loyalty_program_app.backend.enums.PaymentStatus.FAILED);
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
                .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
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

        BookingResponse dto = new BookingResponse();
        dto.setId(b.getId());
        dto.setBookingCode(b.getBookingCode() != null ? b.getBookingCode() : "GN-" + b.getId().toString().substring(0, 8).toUpperCase());
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

        if (b.getPayment() != null) {
            dto.setPaymentMethod(b.getPayment().getPaymentMethod() != null ? b.getPayment().getPaymentMethod().name() : "CASH");
            if (b.getStatus() == BookingStatus.CANCELLED) {
                if (b.getPayment().getPaymentMethod() == com.loyalty_program_app.backend.enums.PaymentMethod.CASH ||
                    b.getPayment().getStatus() == com.loyalty_program_app.backend.enums.PaymentStatus.PENDING) {
                    dto.setPaymentStatus("CANCELLED");
                } else {
                    dto.setPaymentStatus(b.getPayment().getStatus().name());
                }
            } else {
                dto.setPaymentStatus(b.getPayment().getStatus() != null ? b.getPayment().getStatus().name() : "PENDING");
            }
        } else {
            dto.setPaymentMethod("CASH");
            dto.setPaymentStatus(b.getStatus() == BookingStatus.CANCELLED ? "CANCELLED" : "PENDING");
        }

        double pAmount = b.getPricePaid() != null ? b.getPricePaid() : (b.getTotalAmount() != null ? b.getTotalAmount() : 0.0);
        double multiplier = 1.0;
        if (b.getUser() != null && b.getUser().getTier() != null) {
            switch (b.getUser().getTier()) {
                case DIAMOND -> multiplier = 2.0;
                case PLATINUM -> multiplier = 1.5;
                case GOLD -> multiplier = 1.25;
                case SILVER -> multiplier = 1.0;
            }
        }
        dto.setExpectedRewardPoints(Math.max(1, (int) Math.round((pAmount / 100.0) * multiplier)));
        dto.setPointsConfirmed(b.getStatus() == BookingStatus.COMPLETED);

        dto.setScheduledAt(
                b.getScheduledAt() != null
                        ? b.getScheduledAt()
                        : null
        );
        dto.setNote(b.getNote());
        dto.setBookedBy(b.getBookedBy());

        if (b.getStore() != null) {
            dto.setStoreId(b.getStore().getId());
            dto.setStoreName(b.getStoreNameSnapshot() != null ? b.getStoreNameSnapshot() : b.getStore().getName());
            dto.setStoreAddress(b.getStoreAddressSnapshot() != null ? b.getStoreAddressSnapshot() : b.getStore().getAddress());
        } else if (b.getStoreNameSnapshot() != null) {
            dto.setStoreName(b.getStoreNameSnapshot());
            dto.setStoreAddress(b.getStoreAddressSnapshot());
        }

        if (b.getBookingItems() != null) {
            dto.setItems(
                    b.getBookingItems().stream()
                            .map(this::mapItem)
                            .collect(Collectors.toList())
            );
        }

        List<BookingProduct> prods = bookingProductRepository.findByBookingId(b.getId());
        if (prods != null && !prods.isEmpty()) {
            dto.setProducts(prods.stream().map(bp -> com.loyalty_program_app.backend.dto.product.BookingProductResponse.builder()
                    .id(bp.getId())
                    .productId(bp.getProduct() != null ? bp.getProduct().getId() : null)
                    .productName(bp.getProductNameSnapshot())
                    .brand(bp.getProduct() != null ? bp.getProduct().getBrand() : null)
                    .volumeOrSize(bp.getProduct() != null ? bp.getProduct().getVolumeOrSize() : null)
                    .image(bp.getProduct() != null ? bp.getProduct().getImage() : null)
                    .unitPrice(bp.getUnitPriceSnapshot())
                    .quantity(bp.getQuantity())
                    .totalPrice(bp.getTotalPrice())
                    .build()).collect(Collectors.toList()));
        } else {
            dto.setProducts(new ArrayList<>());
        }

        dto.setTimeline(bookingTimelineService.getTimelineForBooking(b));

        return dto;
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
                .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
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
                .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
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

        double pricePaid = Math.max(0.0, totalAmount - discount);
        booking.setTotalAmount(totalAmount);
        booking.setPricePaid(pricePaid);
        booking.setTotalDurationMinutes(totalDuration);
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
        } else if (booking.getStoreNameSnapshot() != null) {
            dto.setStoreName(booking.getStoreNameSnapshot());
            dto.setStoreAddress(booking.getStoreAddressSnapshot());
        }

        dto.setTotalAmount(booking.getTotalAmount());
        dto.setPricePaid(booking.getPricePaid());

        dto.setCouponApplied(
                booking.getCoupon() != null
                        ? booking.getCoupon().getCode()
                        : null
        );

        if (booking.getPayment() != null) {
            dto.setPaymentId(booking.getPayment().getId());
            dto.setPaymentMethod(booking.getPayment().getPaymentMethod() != null ? booking.getPayment().getPaymentMethod().name() : "CASH");
            if (booking.getStatus() == BookingStatus.CANCELLED) {
                if (booking.getPayment().getPaymentMethod() == com.loyalty_program_app.backend.enums.PaymentMethod.CASH ||
                    booking.getPayment().getStatus() == com.loyalty_program_app.backend.enums.PaymentStatus.PENDING) {
                    dto.setPaymentStatus("CANCELLED");
                } else {
                    dto.setPaymentStatus(booking.getPayment().getStatus().name());
                }
            } else {
                dto.setPaymentStatus(booking.getPayment().getStatus() != null ? booking.getPayment().getStatus().name() : "PENDING");
            }
            dto.setInvoiceNumber(booking.getPayment().getInvoiceNumber());
        } else {
            dto.setPaymentMethod("CASH");
            dto.setPaymentStatus(booking.getStatus() == BookingStatus.CANCELLED ? "CANCELLED" : "PENDING");
        }

        double detailsAmount = booking.getPricePaid() != null ? booking.getPricePaid() : (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0);
        double dMultiplier = 1.0;
        if (booking.getUser() != null && booking.getUser().getTier() != null) {
            switch (booking.getUser().getTier()) {
                case DIAMOND -> dMultiplier = 2.0;
                case PLATINUM -> dMultiplier = 1.5;
                case GOLD -> dMultiplier = 1.25;
                case SILVER -> dMultiplier = 1.0;
            }
        }
        dto.setExpectedRewardPoints(Math.max(1, (int) Math.round((detailsAmount / 100.0) * dMultiplier)));
        dto.setPointsConfirmed(booking.getStatus() == BookingStatus.COMPLETED);

        if (booking.getScheduledAt() != null && booking.getStatus() != BookingStatus.CANCELLED && booking.getStatus() != BookingStatus.COMPLETED) {
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
            dto.setProducts(prods.stream().map(bp -> com.loyalty_program_app.backend.dto.product.BookingProductResponse.builder()
                    .id(bp.getId())
                    .productId(bp.getProduct() != null ? bp.getProduct().getId() : null)
                    .productName(bp.getProductNameSnapshot())
                    .brand(bp.getProduct() != null ? bp.getProduct().getBrand() : null)
                    .volumeOrSize(bp.getProduct() != null ? bp.getProduct().getVolumeOrSize() : null)
                    .image(bp.getProduct() != null ? bp.getProduct().getImage() : null)
                    .unitPrice(bp.getUnitPriceSnapshot())
                    .quantity(bp.getQuantity())
                    .totalPrice(bp.getTotalPrice())
                    .build()).collect(Collectors.toList()));
        } else {
            dto.setProducts(new ArrayList<>());
        }

        dto.setTimeline(bookingTimelineService.getTimelineForBooking(booking));

        return dto;
    }

    private BookingItemDetailsResponse mapItem(BookingItem item) {
        BookingItemDetailsResponse dto = new BookingItemDetailsResponse();
        dto.setId(item.getId());
        dto.setServiceId(item.getService() != null ? item.getService().getId() : null);
        dto.setServiceName(item.getServiceNameSnapshot());
        dto.setPrice(item.getServicePriceSnapshot());
        dto.setDurationMinutes(item.getServiceDurationSnapshot());
        dto.setStatus(item.getStatus() != null ? item.getStatus().name() : null);
        return dto;
    }
}
