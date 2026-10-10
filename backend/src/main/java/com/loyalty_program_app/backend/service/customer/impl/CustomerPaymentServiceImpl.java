package com.loyalty_program_app.backend.service.customer.impl;

import com.loyalty_program_app.backend.dto.payment.PaymentCheckoutRequest;
import com.loyalty_program_app.backend.dto.payment.PaymentResponse;
import com.loyalty_program_app.backend.enums.*;
import com.loyalty_program_app.backend.model.*;
import com.loyalty_program_app.backend.repository.*;
import com.loyalty_program_app.backend.service.customer.CustomerPaymentService;
import com.loyalty_program_app.backend.service.utils.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerPaymentServiceImpl implements CustomerPaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    @Override
    public Page<PaymentResponse> getMyPayments(UUID userId, Pageable pageable) {
        Page<Payment> page = paymentRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return page.map(this::toDto);
    }

    @Override
    public PaymentResponse getMyPayment(UUID userId, UUID paymentId) {
        Payment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (!p.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not allowed to view this payment");
        }

        return toDto(p);
    }

    @Override
    @Transactional
    public PaymentResponse checkoutPayment(UUID userId, PaymentCheckoutRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied to this booking");
        }

        if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.COMPLETED) {
            throw new RuntimeException("Payment has already been completed for this booking");
        }

        PaymentMethod method;
        try {
            method = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
        } catch (Exception e) {
            method = PaymentMethod.UPI;
        }

        String invoiceNumber = "INV-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100);
        String gatewayId = request.getPaymentGatewayId() != null && !request.getPaymentGatewayId().isBlank()
                ? request.getPaymentGatewayId()
                : "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .invoiceNumber(invoiceNumber)
                .user(user)
                .amount(booking.getPricePaid())
                .paymentMethod(method)
                .paymentModeDetails(request.getPaymentModeDetails() != null ? request.getPaymentModeDetails() : method.name())
                .status(PaymentStatus.COMPLETED)
                .paymentGatewayId(gatewayId)
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        booking.setPayment(savedPayment);
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Calculate and award reward points
        int pointsToAward = 25; // default minimum
        if (booking.getBookingItems() != null && !booking.getBookingItems().isEmpty()) {
            int calculated = booking.getBookingItems().stream()
                    .filter(i -> i.getService() != null && i.getService().getRewards() != null)
                    .mapToInt(i -> i.getService().getRewards())
                    .sum();
            if (calculated > 0) {
                pointsToAward = calculated;
            }
        }

        user.setPoints(user.getPoints() + pointsToAward);
        if (user.getPoints() >= 1000) {
            user.setTier(Tier.PLATINUM);
        } else if (user.getPoints() >= 500) {
            user.setTier(Tier.GOLD);
        }
        userRepository.save(user);

        // Record in points ledger
        PointsLedger ledger = new PointsLedger();
        ledger.setUser(user);
        ledger.setChangeAmount(pointsToAward);
        ledger.setReason(PointReason.BOOKING_COMPLETED);
        ledger.setRelatedId(booking.getId());
        ledger.setCreatedAt(LocalDateTime.now());
        pointsLedgerRepository.save(ledger);

        // In-app Notification
        Notification notif = Notification.builder()
                .user(user)
                .title("Payment Successful")
                .message("Payment of ₹" + savedPayment.getAmount() + " for booking confirmed! You earned " + pointsToAward + " loyalty points.")
                .type(NotificationType.PAYMENT)
                .build();
        notificationRepository.save(notif);

        return toDto(savedPayment);
    }

    private PaymentResponse toDto(Payment p) {
        PaymentResponse dto = new PaymentResponse();
        dto.setId(p.getId());
        dto.setInvoiceNumber(p.getInvoiceNumber());
        dto.setUserId(p.getUser().getId());
        dto.setUserName(p.getUser().getName());
        dto.setUserEmail(p.getUser().getEmail());
        dto.setAmount(p.getAmount());
        dto.setPaymentMethod(p.getPaymentMethod().name());
        dto.setPaymentModeDetails(p.getPaymentModeDetails());
        dto.setStatus(p.getStatus().name());
        dto.setPaymentGatewayId(p.getPaymentGatewayId());
        dto.setCreatedAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : LocalDateTime.now().toString());
        return dto;
    }
}
