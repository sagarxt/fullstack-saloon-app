package com.groomish_now.backend.service.staff.impl;

import com.groomish_now.backend.dto.mail.BookingEmailDto;
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
import com.groomish_now.backend.dto.booking.BookingResponse;
import com.groomish_now.backend.dto.booking.CustomerUpdateBookingRequest;
import com.groomish_now.backend.dto.staff.StaffCreateBookingRequest;
import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.util.BookingCodeGenerator;
import com.groomish_now.backend.model.*;
import com.groomish_now.backend.repository.*;
import com.groomish_now.backend.service.staff.StaffBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StaffBookingServiceImpl implements StaffBookingService {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final CouponRepository couponRepository;
    private final StoreRepository storeRepository;
    private final NotificationRepository notificationRepository;
    private final BookingItemRepository bookingItemRepository;
    private final BookingProductRepository bookingProductRepository;
    private final BookingTimelineService bookingTimelineService;
    private final BranchCatalogService branchCatalogService;
    private final LoyaltyConfigService loyaltyConfigService;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final EmailService emailService;
    private final BookingMapper bookingMapper;
    private final com.groomish_now.backend.service.booking.SlotCapacityService slotCapacityService;

    @Override
    @org.springframework.transaction.annotation.Transactional
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

        Store store = staff.getStore();
        if (store == null && request.getStoreId() != null) {
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

        LocalDateTime scheduledAt = LocalDateTime.parse(request.getScheduledAt());
        if (scheduledAt.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Selected appointment slot cannot be in the past. Please select an upcoming slot.");
        }

        int totalDuration = services.stream().mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0).sum();
        slotCapacityService.validateAndReserveSlotCapacity(
                store != null ? store.getId() : null,
                scheduledAt,
                totalDuration,
                null
        );

        Booking booking = new Booking();
        booking.setUser(customer);
        booking.setStore(store);
        if (store != null) {
            booking.setStoreNameSnapshot(store.getName());
            booking.setStoreAddressSnapshot(store.getAddress() + ", " + store.getCity());
        }
        booking.setBookingCode(BookingCodeGenerator.generateUniqueCode(bookingRepository));
        booking.setScheduledAt(scheduledAt);
        booking.setStatus(BookingStatus.CONFIRMED);
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
            item.setServiceRewardCoinsSnapshot(s.getRewards() != null ? s.getRewards() : 0);
            item.setStatus(BookingStatus.CONFIRMED);

            items.add(item);
            totalAmount += s.getPrice();
        }

        booking.setBookingItems(items);
        booking.setTotalAmount(totalAmount);

        double pricePaid = totalAmount;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(request.getCouponCode())
                    .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

            if (!coupon.isActive()) {
                throw new RuntimeException("Coupon inactive");
            }
            if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Coupon expired");
            }
            if (coupon.getStartDate() != null && coupon.getStartDate().isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Coupon is not active yet (starts on " + coupon.getStartDate().toLocalDate() + ")");
            }
            if (customer != null && coupon.getApplicableUserGroups() != null && !coupon.getApplicableUserGroups().isEmpty() && !coupon.getApplicableUserGroups().contains("ALL")) {
                java.util.Set<String> effectiveGroups = customer.getAllEffectiveGroups();
                boolean matches = coupon.getApplicableUserGroups().stream()
                        .anyMatch(grp -> grp.equalsIgnoreCase("ALL") || effectiveGroups.contains(grp.toUpperCase().trim()));
                if (!matches) {
                    throw new RuntimeException("Coupon '" + coupon.getCode() + "' is exclusively reserved for members of: " + String.join(", ", coupon.getApplicableUserGroups()));
                }
            }
            final java.util.List<String> eligibleCats = coupon.getEligibleCategories();
            boolean hasSpecificCategories = eligibleCats != null && !eligibleCats.isEmpty()
                    && eligibleCats.stream().noneMatch(ec -> ec.trim().equalsIgnoreCase("ALL"));

            double discount = coupon.getDiscount() != null ? coupon.getDiscount() : 0.0;
            if (coupon.getMaxDiscount() != null && discount > coupon.getMaxDiscount()) {
                discount = coupon.getMaxDiscount();
            }

            if (hasSpecificCategories) {
                double eligibleCategoryTotal = items.stream()
                        .filter(item -> item.getService() != null && item.getService().getCategory() != null &&
                                eligibleCats.stream().anyMatch(ec ->
                                        ec.trim().equalsIgnoreCase(item.getService().getCategory().getName()) ||
                                        (item.getService().getCategory().getId() != null && ec.trim().equalsIgnoreCase(item.getService().getCategory().getId().toString())) ||
                                        item.getService().getCategory().getName().toLowerCase().contains(ec.trim().toLowerCase()) ||
                                        ec.trim().toLowerCase().contains(item.getService().getCategory().getName().toLowerCase())
                                )
                        )
                        .mapToDouble(item -> item.getService().getPrice() != null ? item.getService().getPrice() : 0.0)
                        .sum();

                boolean hasEligible = items.stream().anyMatch(item ->
                        item.getService() != null && item.getService().getCategory() != null &&
                        eligibleCats.stream().anyMatch(ec ->
                                ec.trim().equalsIgnoreCase(item.getService().getCategory().getName()) ||
                                (item.getService().getCategory().getId() != null && ec.trim().equalsIgnoreCase(item.getService().getCategory().getId().toString())) ||
                                item.getService().getCategory().getName().toLowerCase().contains(ec.trim().toLowerCase()) ||
                                ec.trim().toLowerCase().contains(item.getService().getCategory().getName().toLowerCase())
                        )
                );

                if (!hasEligible) {
                    throw new RuntimeException("Coupon '" + coupon.getCode() + "' is only valid for categories: " + String.join(", ", eligibleCats));
                }

                if (coupon.getMinAmount() != null && eligibleCategoryTotal < coupon.getMinAmount()) {
                    throw new RuntimeException("Combined total for eligible categories (" + String.join(", ", eligibleCats) + ") is ₹" + eligibleCategoryTotal + ", which does not meet coupon minimum of ₹" + coupon.getMinAmount());
                }

                if (discount > eligibleCategoryTotal) {
                    discount = eligibleCategoryTotal;
                }
            } else {
                if (totalAmount < (coupon.getMinAmount() != null ? coupon.getMinAmount() : 0.0)) {
                    throw new RuntimeException("Minimum amount for coupon is: ₹" + coupon.getMinAmount());
                }
                if (discount > totalAmount) {
                    discount = totalAmount;
                }
            }

            pricePaid = Math.max(totalAmount - discount, 0);
            booking.setCoupon(coupon);
        }

        booking.setPricePaid(pricePaid);

        // Snapshot expected reward points
        double multiplier = 1.0;
        if (customer.getTier() != null) {
            switch (customer.getTier()) {
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

        int baseCoins = (int) Math.round((pricePaid / spendPerCoin) * multiplier);
        int bonusCoins = items.stream()
                .mapToInt(i -> i.getServiceRewardCoinsSnapshot() != null ? i.getServiceRewardCoinsSnapshot() : 0)
                .sum();
        booking.setExpectedRewardPoints(Math.max(1, baseCoins + bonusCoins));

        Payment payment = Payment.builder()
                .user(customer)
                .amount(pricePaid)
                .paymentMethod(PaymentMethod.CASH)
                .paymentModeDetails("Pay at Salon")
                .status(PaymentStatus.PENDING)
                .invoiceNumber("INV-STAFF-" + (System.currentTimeMillis() % 1000000))
                .build();
        paymentRepository.save(payment);
        booking.setPayment(payment);

        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "CREATED",
                "Walk-In Appointment Confirmed",
                "Appointment registered and confirmed for " + customer.getName() + " by stylist " + staff.getName() + " with " + services.size() + " service(s).",
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        return toDto(saved);
    }

    private void validateStaffBranchAccess(User staff, Booking booking, String actionName) {
        if (staff != null && staff.getStore() != null && booking != null && booking.getStore() != null) {
            if (!staff.getStore().getId().equals(booking.getStore().getId())) {
                throw new RuntimeException("Stylists can only " + actionName + " appointments for their assigned branch (" +
                        staff.getStore().getName() + "). This appointment belongs to " + booking.getStore().getName() + ".");
            }
        }
    }

    @Override
    public BookingResponse updateBookingForCustomer(UUID staffId, UUID bookingId, CustomerUpdateBookingRequest request) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateStaffBranchAccess(staff, booking, "reschedule or modify");

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot modify completed/cancelled booking");
        }

        if (request.getScheduledAt() != null) {
            LocalDateTime newScheduledAt = LocalDateTime.parse(request.getScheduledAt());
            if (newScheduledAt.isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Selected appointment slot cannot be in the past. Please select an upcoming slot.");
            }
            booking.setScheduledAt(newScheduledAt);
        }
        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        booking.setStatus(BookingStatus.MODIFIED);
        booking.setBookedBy("MODIFIED_BY_STAFF - " + staff.getName());

        Booking saved = bookingRepository.save(booking);

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Appointment Rescheduled")
                    .message("Your appointment (" + displayCode + ") has been rescheduled to " + saved.getScheduledAt() + " by salon stylist " + staff.getName() + ".")
                    .type(NotificationType.BOOKING)
                    .referenceId(saved.getId())
                    .link("/customer/bookings/" + saved.getId())
                    .build();
            notificationRepository.save(notif);
        }

        String updateDesc = (request.getScheduledAt() != null ? "Rescheduled slot to " + request.getScheduledAt() + ". " : "")
                + (request.getNote() != null ? "Note: " + request.getNote() : "");
        bookingTimelineService.recordTimeline(
                saved,
                "MODIFIED",
                "Appointment Updated by Stylist",
                updateDesc.isBlank() ? "Appointment updated by stylist " + staff.getName() : updateDesc,
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        return toDto(saved);
    }

    @Override
    public BookingResponse cancelBookingForCustomer(UUID staffId, UUID bookingId, String note) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateStaffBranchAccess(staff, booking, "cancel");

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        List<BookingItem> items = bookingItemRepository.findByBookingId(booking.getId());
        if (items != null) {
            items.forEach(bi -> bi.setStatus(BookingStatus.CANCELLED));
            bookingItemRepository.saveAll(items);
        }
        if (note != null && !note.isBlank()) {
            booking.setNote(note);
        }

        booking.setBookedBy("MODIFIED_BY_STAFF - " + staff.getName());

        Booking saved = bookingRepository.save(booking);

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Appointment Cancelled")
                    .message("Your appointment (" + displayCode + ") was cancelled by salon stylist " + staff.getName() + (note != null && !note.isBlank() ? " (" + note + ")" : "."))
                    .type(NotificationType.BOOKING)
                    .referenceId(saved.getId())
                    .link("/customer/bookings/" + saved.getId())
                    .build();
            notificationRepository.save(notif);
        }

        bookingTimelineService.recordTimeline(
                saved,
                "CANCELLED",
                "Appointment Cancelled by Stylist",
                "Appointment cancelled by stylist " + staff.getName() + (note != null && !note.isBlank() ? ". Reason: " + note : "."),
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        return toDto(saved);
    }

    @Override
    public BookingResponse markNoShowForCustomer(UUID staffId, UUID bookingId, String note) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateStaffBranchAccess(staff, booking, "mark as no-show");

        booking.setStatus(BookingStatus.NO_SHOW);
        booking.setCancelledAt(LocalDateTime.now());
        List<BookingItem> items = bookingItemRepository.findByBookingId(booking.getId());
        if (items != null) {
            items.forEach(bi -> bi.setStatus(BookingStatus.NO_SHOW));
            bookingItemRepository.saveAll(items);
        }
        if (note != null && !note.isBlank()) {
            booking.setNote(note);
        }

        booking.setBookedBy("NO_SHOW_MARKED_BY_STAFF - " + staff.getName());

        Booking saved = bookingRepository.save(booking);

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Appointment Recorded as No-Show")
                    .message("Your appointment (" + displayCode + ") was marked as a No-Show by salon stylist " + staff.getName() + (note != null && !note.isBlank() ? " (" + note + ")" : ". Advance deposit forfeited per policy."))
                    .type(NotificationType.BOOKING)
                    .referenceId(saved.getId())
                    .link("/customer/bookings/" + saved.getId())
                    .build();
            notificationRepository.save(notif);

            BookingEmailDto dto = BookingEmailDto.fromBooking(saved);
            emailService.sendBookingNoShowEmail(dto);
        }

        bookingTimelineService.recordTimeline(
                saved,
                "NO_SHOW",
                "Appointment Marked as No-Show by Stylist",
                "Appointment marked as No-Show by stylist " + staff.getName() + (note != null && !note.isBlank() ? ". Reason: " + note : ". Advance deposit forfeited."),
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        return toDto(saved);
    }

    @Override
    public Page<BookingResponse> getCustomerBookings(UUID customerId, Pageable pageable) {
        Page<Booking> page = bookingRepository.findByUserIdOrderByCreatedAtDesc(customerId, pageable);
        return page.map(this::toDto);
    }

    @Override
    public BookingResponse getBooking(UUID bookingId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return toDto(b);
    }

    @Override
    public BookingResponse addServiceToBooking(UUID staffId, UUID bookingId, UUID serviceId, String subServiceName) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateStaffBranchAccess(staff, booking, "add services to");

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot add service to " + booking.getStatus() + " booking");
        }

        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        if (booking.getStore() != null && !branchCatalogService.isServiceAvailableAtStore(booking.getStore().getId(), service.getId())) {
            throw new RuntimeException("Service '" + service.getName() + "' is currently disabled or unavailable at " + booking.getStore().getName() + ".");
        }

        String snapshotName = service.getName();
        Double snapshotPrice = service.getPrice();
        Integer snapshotDuration = service.getDurationMinutes();

        if (subServiceName != null && !subServiceName.isBlank() && service.getSubServices() != null) {
            for (com.groomish_now.backend.model.SubService sub : service.getSubServices()) {
                if (subServiceName.trim().equalsIgnoreCase(sub.getName().trim())) {
                    snapshotName = service.getName() + " (" + sub.getName().trim() + ")";
                    if (sub.getPrice() != null) snapshotPrice = sub.getPrice();
                    if (sub.getDurationMinutes() != null) snapshotDuration = sub.getDurationMinutes();
                    break;
                }
            }
        }

        BookingItem item = new BookingItem();
        item.setBooking(booking);
        item.setService(service);
        item.setServiceNameSnapshot(snapshotName);
        item.setServicePriceSnapshot(snapshotPrice);
        item.setServiceDurationSnapshot(snapshotDuration);
        item.setServiceRewardCoinsSnapshot(service.getRewards() != null ? service.getRewards() : 0);
        item.setStatus(booking.getStatus());
        bookingItemRepository.save(item);

        if (booking.getBookingItems() == null) {
            booking.setBookingItems(new ArrayList<>());
        }
        booking.getBookingItems().add(item);

        recalculateBookingTotals(booking);
        booking.setStatus(BookingStatus.MODIFIED);
        booking.setBookedBy("MODIFIED_BY_STAFF - " + staff.getName());
        Booking saved = bookingRepository.save(booking);

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Service Added by Stylist")
                    .message("Stylist " + staff.getName() + " added " + snapshotName + " to your appointment (" + displayCode + ").")
                    .type(NotificationType.BOOKING)
                    .referenceId(saved.getId())
                    .link("/customer/bookings/" + saved.getId())
                    .build();
            notificationRepository.save(notif);
        }

        bookingTimelineService.recordTimeline(
                saved,
                "SERVICE_ADDED",
                "Service Added by Stylist",
                "Stylist " + staff.getName() + " added " + snapshotName + " (₹" + snapshotPrice + ", " + snapshotDuration + " mins) to appointment.",
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        return toDto(saved);
    }

    @Override
    public BookingResponse removeServiceFromBooking(UUID staffId, UUID bookingId, UUID itemId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateStaffBranchAccess(staff, booking, "remove services from");

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot remove service from " + booking.getStatus() + " booking");
        }

        if (booking.getBookingItems() == null || booking.getBookingItems().size() <= 1) {
            throw new RuntimeException("Cannot remove the only service in this appointment. Please cancel the appointment if needed.");
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
        booking.setBookedBy("MODIFIED_BY_STAFF - " + staff.getName());
        Booking saved = bookingRepository.save(booking);

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Service Removed by Stylist")
                    .message("Stylist " + staff.getName() + " removed " + removedServiceName + " from your appointment (" + displayCode + ").")
                    .type(NotificationType.BOOKING)
                    .referenceId(saved.getId())
                    .link("/customer/bookings/" + saved.getId())
                    .build();
            notificationRepository.save(notif);
        }

        bookingTimelineService.recordTimeline(
                saved,
                "SERVICE_REMOVED",
                "Service Removed by Stylist",
                "Stylist " + staff.getName() + " removed " + removedServiceName + " from appointment.",
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        return toDto(saved);
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
        if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.COMPLETED) {
            double confirmed = booking.getPayment().getAmount() != null ? booking.getPayment().getAmount() : currentPaid;
            booking.setPricePaid(Math.min(confirmed, finalAmount));
        } else if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.PENDING) {
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

    private BookingResponse toDto(Booking b) {
        return bookingMapper.toBookingResponse(b);
    }

    @Override
    public BookingResponse confirmBookingForCustomer(UUID staffId, UUID bookingId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateStaffBranchAccess(staff, booking, "confirm");

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot confirm a " + booking.getStatus() + " booking");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        if (booking.getBookingItems() != null) {
            for (BookingItem bi : booking.getBookingItems()) {
                if (bi.getStatus() == BookingStatus.PENDING) {
                    bi.setStatus(BookingStatus.CONFIRMED);
                    bookingItemRepository.save(bi);
                }
            }
        }
        booking.setBookedBy(booking.getBookedBy() != null ? booking.getBookedBy() : ("CONFIRMED_BY_STAFF - " + staff.getName()));

        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "CONFIRMED",
                "Appointment Confirmed by Staff",
                "Appointment confirmed by salon stylist " + staff.getName() + " (payment verified/accepted at salon).",
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Booking Confirmed")
                    .message("Your booking (" + displayCode + ") has been confirmed by salon stylist " + staff.getName() + ".")
                    .type(NotificationType.BOOKING)
                    .referenceId(saved.getId())
                    .link("/customer/bookings/" + saved.getId())
                    .build();
            notificationRepository.save(notif);
        }

        return toDto(saved);
    }

    @Override
    public BookingResponse startBookingForCustomer(UUID staffId, UUID bookingId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateStaffBranchAccess(staff, booking, "start");

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot start a " + booking.getStatus() + " booking");
        }

        if (booking.getCheckedInAt() == null) {
            booking.setCheckedInAt(LocalDateTime.now());
        }
        booking.setStatus(BookingStatus.IN_PROGRESS);
        if (booking.getBookingItems() != null) {
            for (BookingItem bi : booking.getBookingItems()) {
                bi.setStatus(BookingStatus.IN_PROGRESS);
                bookingItemRepository.save(bi);
            }
        }
        booking.setBookedBy("IN_PROGRESS_BY_STAFF - " + staff.getName());

        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "IN_PROGRESS",
                "Customer Checked In - Service In Progress",
                "Customer visited salon. Booking marked In Progress by stylist " + staff.getName() + ".",
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Service In Progress ✂️")
                    .message("Welcome to Groomish Now! Your salon session (" + displayCode + ") is currently in progress with stylist " + staff.getName() + ".")
                    .type(NotificationType.BOOKING)
                    .referenceId(saved.getId())
                    .link("/customer/bookings/" + saved.getId())
                    .build();
            notificationRepository.save(notif);

            String serviceName = (saved.getBookingItems() != null && !saved.getBookingItems().isEmpty())
                    ? saved.getBookingItems().get(0).getServiceNameSnapshot() : "Salon Service";
            emailService.sendBookingStatusEmail(
                    saved.getUser().getEmail(),
                    saved.getUser().getName(),
                    displayCode,
                    serviceName,
                    "IN_PROGRESS",
                    "Welcome to Groomish Now! Your stylist " + staff.getName() + " has checked you in and your booking is now in progress. Relax and enjoy your bespoke grooming treatments."
            );
        }

        return toDto(saved);
    }

    @Override
    public BookingResponse checkInBookingForCustomer(UUID staffId, UUID bookingId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateStaffBranchAccess(staff, booking, "check-in");

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot check in a " + booking.getStatus() + " booking");
        }

        booking.setStatus(BookingStatus.CHECKED_IN);
        LocalDateTime now = LocalDateTime.now();
        booking.setCheckedInAt(now);
        if (booking.getBookingItems() != null) {
            for (BookingItem bi : booking.getBookingItems()) {
                bi.setStatus(BookingStatus.CHECKED_IN);
                bookingItemRepository.save(bi);
            }
        }
        booking.setBookedBy("CHECKED_IN_BY_STAFF - " + staff.getName());

        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "CHECKED_IN",
                "Client Checked In",
                "Customer arrived at the salon and checked in with stylist " + staff.getName() + ". Services are now underway.",
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Checked In at Salon ✂️")
                    .message("Welcome to Groomish Now! You are checked in (" + displayCode + "). Services are underway with stylist " + staff.getName() + ".")
                    .type(NotificationType.BOOKING)
                    .referenceId(saved.getId())
                    .link("/customer/bookings/" + saved.getId())
                    .build();
            notificationRepository.save(notif);

            String serviceName = (saved.getBookingItems() != null && !saved.getBookingItems().isEmpty())
                    ? saved.getBookingItems().get(0).getServiceNameSnapshot() : "Salon Service";
            emailService.sendBookingStatusEmail(
                    saved.getUser().getEmail(),
                    saved.getUser().getName(),
                    displayCode,
                    serviceName,
                    "CHECKED_IN",
                    "Welcome to Groomish Now! Stylist " + staff.getName() + " has checked you in for your appointment. Relax and enjoy your bespoke grooming treatments."
            );
        }

        return toDto(saved);
    }
}
