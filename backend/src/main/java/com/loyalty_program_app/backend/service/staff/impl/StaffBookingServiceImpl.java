package com.loyalty_program_app.backend.service.staff.impl;

import com.loyalty_program_app.backend.dto.booking.BookingItemDetailsResponse;
import com.loyalty_program_app.backend.dto.booking.BookingItemResponse;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.booking.CustomerUpdateBookingRequest;
import com.loyalty_program_app.backend.dto.staff.StaffCreateBookingRequest;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.*;
import com.loyalty_program_app.backend.repository.*;
import com.loyalty_program_app.backend.service.staff.StaffBookingService;
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
    private final PaymentRepository paymentRepository;
    private final CouponRepository couponRepository;
    private final StoreRepository storeRepository;
    private final NotificationRepository notificationRepository;
    private final BookingItemRepository bookingItemRepository;
    private final BookingProductRepository bookingProductRepository;
    private final com.loyalty_program_app.backend.service.BookingTimelineService bookingTimelineService;
    private final com.loyalty_program_app.backend.service.BranchCatalogService branchCatalogService;
    private final com.loyalty_program_app.backend.service.LoyaltyConfigService loyaltyConfigService;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final com.loyalty_program_app.backend.service.utils.EmailService emailService;

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

        Booking booking = new Booking();
        booking.setUser(customer);
        booking.setStore(store);
        if (store != null) {
            booking.setStoreNameSnapshot(store.getName());
            booking.setStoreAddressSnapshot(store.getAddress() + ", " + store.getCity());
        }
        booking.setBookingCode(com.loyalty_program_app.backend.util.BookingCodeGenerator.generateUniqueCode(bookingRepository));
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
                .paymentMethod(com.loyalty_program_app.backend.enums.PaymentMethod.CASH)
                .paymentModeDetails("Pay at Salon")
                .status(com.loyalty_program_app.backend.enums.PaymentStatus.PENDING)
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
                    .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
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

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
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
                    .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
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

    @Override
    public BookingResponse addServiceToBooking(UUID staffId, UUID bookingId, UUID serviceId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot add service to " + booking.getStatus() + " booking");
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
        booking.setBookedBy("MODIFIED_BY_STAFF - " + staff.getName());
        Booking saved = bookingRepository.save(booking);

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Service Added by Stylist")
                    .message("Stylist " + staff.getName() + " added " + service.getName() + " to your appointment (" + displayCode + ").")
                    .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
                    .referenceId(saved.getId())
                    .link("/customer/bookings/" + saved.getId())
                    .build();
            notificationRepository.save(notif);
        }

        bookingTimelineService.recordTimeline(
                saved,
                "SERVICE_ADDED",
                "Service Added by Stylist",
                "Stylist " + staff.getName() + " added " + service.getName() + " (₹" + service.getPrice() + ", " + service.getDurationMinutes() + " mins) to appointment.",
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
                    .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
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

        double pricePaid = Math.max(0.0, totalAmount - discount);
        booking.setTotalAmount(totalAmount);
        booking.setPricePaid(pricePaid);
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

        int baseCoins = (int) Math.round((pricePaid / spendPerCoin) * multiplier);
        int bonusCoins = 0;
        if (booking.getBookingItems() != null) {
            bonusCoins = booking.getBookingItems().stream()
                    .mapToInt(i -> i.getServiceRewardCoinsSnapshot() != null ? i.getServiceRewardCoinsSnapshot() : 0)
                    .sum();
        }
        booking.setExpectedRewardPoints(Math.max(1, baseCoins + bonusCoins));
    }

    private BookingResponse toDto(Booking b) {
        BookingResponse dto = new BookingResponse();
        dto.setId(b.getId());
        dto.setBookingCode(b.getBookingCode() != null ? b.getBookingCode() : "GN-" + b.getId().toString().substring(0, 8).toUpperCase());
        dto.setUserId(b.getUser() != null ? b.getUser().getId() : null);
        dto.setUserName(b.getUser() != null ? b.getUser().getName() : null);
        dto.setPaymentId(b.getPayment() != null ? b.getPayment().getId() : null);
        dto.setCouponId(b.getCoupon() != null ? b.getCoupon().getId() : null);
        dto.setCouponCode(b.getCoupon() != null ? b.getCoupon().getCode() : null);
        dto.setCouponApplied(b.getCoupon() != null ? b.getCoupon().getCode() : null);
        dto.setTotalAmount(b.getTotalAmount());
        dto.setPricePaid(b.getPricePaid());
        dto.setStatus(b.getStatus().name());
        dto.setScheduledAt(b.getScheduledAt() != null ? b.getScheduledAt() : null);
        dto.setBookedBy(b.getBookedBy());

        if (b.getPayment() != null) {
            dto.setPaymentMethod(b.getPayment().getPaymentMethod() != null ? b.getPayment().getPaymentMethod().name() : "CASH");
            dto.setInvoiceNumber(b.getPayment().getInvoiceNumber());
            if (b.getStatus() == BookingStatus.COMPLETED) {
                dto.setPaymentStatus("COMPLETED");
            } else if (b.getStatus() == BookingStatus.CANCELLED) {
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
            if (b.getStatus() == BookingStatus.COMPLETED) {
                dto.setPaymentStatus("COMPLETED");
            } else if (b.getStatus() == BookingStatus.CANCELLED) {
                dto.setPaymentStatus("CANCELLED");
            } else {
                dto.setPaymentStatus("PENDING");
            }
        }

        if (b.getStore() != null) {
            dto.setStoreId(b.getStore().getId());
            dto.setStoreName(b.getStoreNameSnapshot() != null ? b.getStoreNameSnapshot() : b.getStore().getName());
            dto.setStoreAddress(b.getStoreAddressSnapshot() != null ? b.getStoreAddressSnapshot() : b.getStore().getAddress());
        } else if (b.getStoreNameSnapshot() != null) {
            dto.setStoreName(b.getStoreNameSnapshot());
            dto.setStoreAddress(b.getStoreAddressSnapshot());
        }

        if (b.getBookingItems() != null && !b.getBookingItems().isEmpty()) {
            BookingItem first = b.getBookingItems().get(0);
            dto.setServiceId(first.getService() != null ? first.getService().getId() : null);
            dto.setServiceName(first.getServiceNameSnapshot());

            dto.setItems(b.getBookingItems().stream().map(it -> {
                BookingItemDetailsResponse itDto = new BookingItemDetailsResponse();
                itDto.setId(it.getId());
                itDto.setServiceId(it.getService() != null ? it.getService().getId() : null);
                String sName = it.getServiceNameSnapshot() != null ? it.getServiceNameSnapshot() : (it.getService() != null ? it.getService().getName() : "Salon Service");
                itDto.setServiceName(sName);
                Double itemPrice = it.getServicePriceSnapshot();
                if ((itemPrice == null || itemPrice == 0.0) && it.getService() != null && it.getService().getPrice() != null) {
                    itemPrice = it.getService().getPrice();
                }
                itDto.setPrice(itemPrice != null ? itemPrice : 0.0);

                Double subMrp = null;
                if (it.getService() != null && it.getService().getSubServices() != null) {
                    for (com.loyalty_program_app.backend.model.SubService sub : it.getService().getSubServices()) {
                        if (sub.getName() != null && sName.toLowerCase().contains(sub.getName().toLowerCase())) {
                            if (sub.getMrp() != null && sub.getMrp() > 0) {
                                subMrp = sub.getMrp();
                            }
                            break;
                        }
                    }
                }
                double uMrp = subMrp != null ? subMrp
                        : (it.getService() != null && it.getService().getMrp() != null && it.getService().getMrp() > 0
                                ? it.getService().getMrp()
                                : itDto.getPrice());
                if (uMrp < itDto.getPrice()) {
                    uMrp = itDto.getPrice();
                }
                itDto.setMrp(uMrp);

                itDto.setDurationMinutes(it.getServiceDurationSnapshot());
                itDto.setRewardCoins(it.getServiceRewardCoinsSnapshot() != null ? it.getServiceRewardCoinsSnapshot() : 0);
                itDto.setImage(it.getService() != null ? it.getService().getImage() : null);
                itDto.setStatus(it.getStatus() != null ? it.getStatus().name() : null);
                return itDto;
            }).collect(Collectors.toList()));
        } else {
            dto.setItems(new ArrayList<>());
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
                    .mrp(bp.getProduct() != null && bp.getProduct().getMrp() != null ? bp.getProduct().getMrp() : bp.getUnitPriceSnapshot())
                    .quantity(bp.getQuantity())
                    .totalPrice(bp.getTotalPrice())
                    .build()).collect(Collectors.toList()));
        } else {
            dto.setProducts(new ArrayList<>());
        }

        int resolvedPoints = 0;
        if (b.getStatus() == BookingStatus.COMPLETED) {
            List<PointsLedger> ledgers = pointsLedgerRepository.findByRelatedId(b.getId());
            if (ledgers != null && !ledgers.isEmpty()) {
                resolvedPoints = ledgers.stream().mapToInt(l -> l.getChangeAmount() != null ? l.getChangeAmount() : 0).sum();
            }
        }
        if (resolvedPoints <= 0 && b.getExpectedRewardPoints() != null && b.getExpectedRewardPoints() > 0) {
            resolvedPoints = b.getExpectedRewardPoints();
        }
        if (resolvedPoints <= 0) {
            double pAmount = dto.getPricePaid() != null ? dto.getPricePaid() : 0.0;
            double multiplier = 1.0;
            if (b.getUser() != null && b.getUser().getTier() != null) {
                switch (b.getUser().getTier()) {
                    case DIAMOND -> multiplier = 2.0;
                    case PLATINUM -> multiplier = 1.5;
                    case GOLD -> multiplier = 1.25;
                    case SILVER -> multiplier = 1.0;
                }
            }
            resolvedPoints = Math.max(1, (int) Math.round((pAmount / 100.0) * multiplier));
        }
        dto.setExpectedRewardPoints(resolvedPoints);
        dto.setPointsConfirmed(b.getStatus() == BookingStatus.COMPLETED);

        dto.setTimeline(bookingTimelineService.getTimelineForBooking(b));

        return dto;
    }

    @Override
    public BookingResponse confirmBookingForCustomer(UUID staffId, UUID bookingId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

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
                    .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
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

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot start a " + booking.getStatus() + " booking");
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
                    .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
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
}
