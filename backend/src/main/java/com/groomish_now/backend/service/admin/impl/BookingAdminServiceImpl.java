package com.groomish_now.backend.service.admin.impl;

import com.groomish_now.backend.dto.mail.BookingEmailDto;
import com.groomish_now.backend.enums.*;
import com.groomish_now.backend.mapper.BookingMapper;
import com.groomish_now.backend.model.*;
import com.groomish_now.backend.repository.*;
import com.groomish_now.backend.service.booking.BookingTimelineService;
import com.groomish_now.backend.service.loyalty.LoyaltyConfigService;
import com.groomish_now.backend.service.utils.EmailService;
import com.groomish_now.backend.dto.booking.BookingItemDetailsResponse;
import com.groomish_now.backend.dto.booking.BookingResponse;
import com.groomish_now.backend.dto.booking.BookingUpdateRequest;
import com.groomish_now.backend.model.*;
import com.groomish_now.backend.repository.*;
import com.groomish_now.backend.service.admin.BookingAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingAdminServiceImpl implements BookingAdminService {

    private final BookingRepository bookingRepository;
    private final BookingItemRepository bookingItemRepository;
    private final BookingProductRepository bookingProductRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final BookingTimelineService bookingTimelineService;
    private final LoyaltyConfigService loyaltyConfigService;
    private final EmailService emailService;
    private final NotificationRepository notificationRepository;
    private final BookingMapper bookingMapper;

    // ===================== ADVANCED SEARCH =====================
    @Override
    public Page<BookingResponse> searchBookings(
            String bookingId,
            String customerName,
            String customerEmail,
            String status,
            UUID storeId,
            String fromDate,
            String toDate,
            Pageable pageable
    ) {
        Specification<Booking> spec = Specification.allOf();

        if (bookingId != null && !bookingId.isBlank()) {
            final String q = bookingId.trim().toLowerCase();
            spec = spec.and((root, query, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("id").as(String.class)), "%" + q + "%"),
                            cb.like(cb.lower(root.get("bookingCode")), "%" + q + "%")
                    )
            );
        }

        if (customerName != null && !customerName.isBlank()) {
            final String cName = customerName.trim().toLowerCase();
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.join("user").get("name")), "%" + cName + "%")
            );
        }

        if (customerEmail != null && !customerEmail.isBlank()) {
            final String cEmail = customerEmail.trim().toLowerCase();
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.join("user").get("email")), "%" + cEmail + "%")
            );
        }

        if (status != null && !status.isBlank()) {
            final String st = status.trim().toUpperCase();
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), BookingStatus.valueOf(st))
            );
        }

        if (storeId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("store").get("id"), storeId)
            );
        }

        if (fromDate != null && !fromDate.isBlank()) {
            LocalDateTime from = parseDate(fromDate).atStartOfDay();
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("scheduledAt"), from)
            );
        }

        if (toDate != null && !toDate.isBlank()) {
            LocalDateTime to = parseDate(toDate).atTime(23, 59, 59);
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("scheduledAt"), to)
            );
        }

        Page<Booking> page = bookingRepository.findAll(spec, pageable);
        return page.map(this::toBookingResponse);
    }

    // ===================== GET ONE BOOKING =====================
    @Override
    public BookingResponse getBookingById(UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return toBookingResponse(booking);
    }

    // ===================== UPDATE BOOKING =====================
    @Override
    public BookingResponse updateBooking(UUID id, BookingUpdateRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (request.getScheduledAt() != null && !request.getScheduledAt().isBlank()) {
            try {
                LocalDateTime newTime = LocalDateTime.parse(request.getScheduledAt());
                booking.setScheduledAt(newTime);
                booking.setStatus(BookingStatus.MODIFIED);
            } catch (DateTimeParseException e) {
                throw new RuntimeException("Invalid scheduledAt format. Use ISO format: 2026-10-20T15:30:00");
            }
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            BookingStatus newStatus = BookingStatus.valueOf(request.getStatus().trim().toUpperCase());
            booking.setStatus(newStatus);
            if (booking.getBookingItems() != null) {
                for (BookingItem bi : booking.getBookingItems()) {
                    bi.setStatus(newStatus);
                    bookingItemRepository.save(bi);
                }
            }

            if (newStatus == BookingStatus.CHECKED_IN || newStatus == BookingStatus.IN_PROGRESS) {
                if (booking.getCheckedInAt() == null) {
                    booking.setCheckedInAt(LocalDateTime.now());
                }
            } else if (newStatus == BookingStatus.CANCELLED) {
                booking.setCancelledAt(LocalDateTime.now());
                if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.PENDING) {
                    booking.getPayment().setStatus(PaymentStatus.CANCELLED);
                    paymentRepository.save(booking.getPayment());
                }
                List<BookingItem> bItems = bookingItemRepository.findByBookingId(booking.getId());
                if (bItems != null) {
                    bItems.forEach(bi -> bi.setStatus(BookingStatus.CANCELLED));
                    bookingItemRepository.saveAll(bItems);
                }
            } else if (newStatus == BookingStatus.COMPLETED) {
                booking.setCompletedAt(LocalDateTime.now());

                // Auto-confirm payment if cash or pending
                Payment p = booking.getPayment();
                if (p == null) {
                    double finalPrice = booking.getPricePaid() != null ? booking.getPricePaid() : (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0);
                    p = Payment.builder()
                            .user(booking.getUser())
                            .amount(finalPrice)
                            .paymentMethod(PaymentMethod.CASH)
                            .status(PaymentStatus.COMPLETED)
                            .invoiceNumber("INV-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100))
                            .build();
                    p = paymentRepository.save(p);
                    booking.setPayment(p);
                    booking.setPricePaid(finalPrice);
                } else if (p.getStatus() == PaymentStatus.PENDING) {
                    p.setStatus(PaymentStatus.COMPLETED);
                    paymentRepository.save(p);
                }

                // Award points if not already awarded
                if (booking.getUser() != null) {
                    boolean alreadyAwarded = pointsLedgerRepository.existsByRelatedId(booking.getId());
                    if (!alreadyAwarded) {
                        User customer = booking.getUser();
                        double amount = booking.getPricePaid() != null ? booking.getPricePaid() : (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0);
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
                            spendPerCoin = loyaltyConfigService.getOrCreateConfig().getSpendAmountPerCoin();
                            if (spendPerCoin <= 0) spendPerCoin = 100.0;
                        } catch (Exception ignored) {}

                        int earned;
                        if (booking.getExpectedRewardPoints() != null && booking.getExpectedRewardPoints() > 0) {
                            earned = booking.getExpectedRewardPoints();
                        } else {
                            int baseEarned = (int) Math.round((amount / spendPerCoin) * multiplier);
                            int bonusCoins = 0;
                            if (booking.getBookingItems() != null) {
                                bonusCoins = booking.getBookingItems().stream()
                                        .mapToInt(i -> i.getServiceRewardCoinsSnapshot() != null ? i.getServiceRewardCoinsSnapshot() : 0)
                                        .sum();
                            }
                            earned = Math.max(1, baseEarned + bonusCoins);
                            booking.setExpectedRewardPoints(earned);
                        }
                        customer.setPoints((customer.getPoints() != null ? customer.getPoints() : 0) + earned);
                        int lifetime = (customer.getLifetimePoints() != null ? customer.getLifetimePoints() : 0) + earned;
                        customer.setLifetimePoints(lifetime);
                        if (lifetime >= 300) customer.setTier(Tier.DIAMOND);
                        else if (lifetime >= 150) customer.setTier(Tier.PLATINUM);
                        else if (lifetime >= 50) customer.setTier(Tier.GOLD);
                        userRepository.save(customer);

                        PointsLedger ledger = new PointsLedger();
                        ledger.setUser(customer);
                        ledger.setChangeAmount(earned);
                        ledger.setReason(PointReason.BOOKING_COMPLETED);
                        ledger.setRelatedId(booking.getId());
                        ledger.setNote("Appointment " + booking.getBookingCode() + " completed");
                        pointsLedgerRepository.save(ledger);
                    }
                }
            }
        }

        // Payment status/method override
        if (request.getPaymentStatus() != null && !request.getPaymentStatus().isBlank()) {
            String psRaw = request.getPaymentStatus().trim().toUpperCase();
            if (psRaw.equals("SUCCESS") || psRaw.equals("PAID")) {
                psRaw = "COMPLETED";
            }
            PaymentStatus pStatus = PaymentStatus.valueOf(psRaw);
            Payment p = booking.getPayment();
            if (p == null) {
                p = Payment.builder()
                        .user(booking.getUser())
                        .amount(booking.getPricePaid() != null ? booking.getPricePaid() : (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0))
                        .paymentMethod(PaymentMethod.CASH)
                        .status(pStatus)
                        .invoiceNumber("INV-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100))
                        .build();
            } else {
                p.setStatus(pStatus);
            }
            p = paymentRepository.save(p);
            booking.setPayment(p);

            // If payment is completed and booking was pending, transition to CONFIRMED
            if (pStatus == PaymentStatus.COMPLETED && booking.getStatus() == BookingStatus.PENDING) {
                booking.setStatus(BookingStatus.CONFIRMED);
                if (booking.getBookingItems() != null) {
                    for (BookingItem bi : booking.getBookingItems()) {
                        if (bi.getStatus() == BookingStatus.PENDING) {
                            bi.setStatus(BookingStatus.CONFIRMED);
                            bookingItemRepository.save(bi);
                        }
                    }
                }
            }
        }

        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            PaymentMethod pMethod = PaymentMethod.valueOf(request.getPaymentMethod().trim().toUpperCase());
            Payment p = booking.getPayment();
            if (p == null) {
                p = Payment.builder()
                        .user(booking.getUser())
                        .amount(booking.getPricePaid() != null ? booking.getPricePaid() : (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0))
                        .paymentMethod(pMethod)
                        .status(PaymentStatus.PENDING)
                        .invoiceNumber("INV-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100))
                        .build();
            } else {
                p.setPaymentMethod(pMethod);
            }
            p = paymentRepository.save(p);
            booking.setPayment(p);
        }

        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        if (request.getTotalAmount() != null) {
            booking.setTotalAmount(request.getTotalAmount());
        }

        if (request.getPricePaid() != null) {
            booking.setPricePaid(request.getPricePaid());
            if (booking.getPayment() != null) {
                booking.getPayment().setAmount(request.getPricePaid());
                paymentRepository.save(booking.getPayment());
            }
        }

        Booking saved = bookingRepository.save(booking);

        StringBuilder desc = new StringBuilder("Admin updated booking:");
        if (request.getStatus() != null) desc.append(" status=").append(request.getStatus());
        if (request.getScheduledAt() != null) desc.append(" scheduledAt=").append(request.getScheduledAt());
        if (request.getPaymentStatus() != null) desc.append(" paymentStatus=").append(request.getPaymentStatus());
        if (request.getPricePaid() != null) desc.append(" pricePaid=₹").append(request.getPricePaid());

        bookingTimelineService.recordTimeline(
                saved,
                "MODIFIED",
                "Booking Modified by Admin (Overrided by Administrator)",
                desc.toString() + " (Overrided by Administrator)",
                "Admin Staff",
                "ADMIN",
                null
        );

        // Dispatch updated details email & notification to customer: (Overrided by Administrator)
        if (saved.getUser() != null && saved.getUser().getEmail() != null) {
            try {
                BookingEmailDto emailDto = BookingEmailDto.fromBooking(saved);
                if (saved.getNote() != null) {
                    emailDto.setAdminNote(saved.getNote());
                }
                if (saved.getStatus() == BookingStatus.COMPLETED) {
                    emailService.sendBookingCompletedEmail(emailDto);
                } else {
                    emailService.sendBookingModifiedEmail(emailDto, true);
                }
            } catch (Exception ex) {
                log.error("Failed to send admin override email: {}", ex.getMessage());
            }

            try {
                Notification overrideNotif = Notification.builder()
                        .user(saved.getUser())
                        .title("Booking Updated (Overrided by Administrator)")
                        .message("Your booking " + (saved.getBookingCode() != null ? saved.getBookingCode() : saved.getId())
                                + " has been modified by an administrator. (Overrided by Administrator)")
                        .type(NotificationType.BOOKING)
                        .build();
                notificationRepository.save(overrideNotif);
            } catch (Exception ignored) {}
        }

        return toBookingResponse(saved);
    }

    // ===================== CANCEL BOOKING =====================
    @Override
    public BookingResponse cancelBooking(UUID id, String note) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        if (booking.getBookingItems() != null) {
            for (BookingItem bi : booking.getBookingItems()) {
                bi.setStatus(BookingStatus.CANCELLED);
                bookingItemRepository.save(bi);
            }
        }

        if (note != null && !note.isBlank()) {
            booking.setNote(note);
        }

        if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.PENDING) {
            booking.getPayment().setStatus(PaymentStatus.CANCELLED);
            paymentRepository.save(booking.getPayment());
        }

        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "CANCELLED",
                "Booking Cancelled by Admin",
                "Booking was cancelled by administrative staff." + (note != null && !note.isBlank() ? " Reason: " + note : ""),
                "Admin Staff",
                "ADMIN",
                null
        );

        return toBookingResponse(saved);
    }

    @Override
    public BookingResponse checkInBooking(UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

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
        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "CHECKED_IN",
                "Client Checked In",
                "Client arrived at salon and was checked in by Administrator. Services are in progress.",
                "Salon Administrator",
                "ADMIN",
                "admin@groomish.now"
        );

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Checked In at Salon ✂️")
                    .message("Welcome to Groomish Now! You are checked in (" + displayCode + "). Services are currently underway.")
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
                    "Welcome to Groomish Now! You have been checked in for your appointment. Relax and enjoy your bespoke grooming treatments."
            );
        }

        return toBookingResponse(saved);
    }

    // ===================== UTIL METHODS =====================
    private LocalDate parseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr);
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format. Use yyyy-MM-dd");
        }
    }

    private BookingResponse toBookingResponse(Booking b) {
        return bookingMapper.toBookingResponse(b);
    }

    private BookingItemDetailsResponse toBookingItemDetailsResponse(BookingItem item) {
        return bookingMapper.toBookingItemDetailsResponse(item);
    }
}
