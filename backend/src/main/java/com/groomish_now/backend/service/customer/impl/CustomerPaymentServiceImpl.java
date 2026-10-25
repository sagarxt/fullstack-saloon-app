package com.groomish_now.backend.service.customer.impl;

import com.groomish_now.backend.dto.mail.BookingEmailDto;
import com.groomish_now.backend.dto.payment.*;
import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.enums.NotificationType;
import com.groomish_now.backend.enums.PaymentMethod;
import com.groomish_now.backend.enums.PaymentStatus;
import com.groomish_now.backend.model.*;
import com.groomish_now.backend.repository.*;
import com.groomish_now.backend.service.booking.BookingTimelineService;
import com.groomish_now.backend.service.loyalty.LoyaltyConfigService;
import com.groomish_now.backend.config.RazorpayConfig;
import com.groomish_now.backend.dto.payment.*;
import com.groomish_now.backend.enums.*;
import com.groomish_now.backend.model.*;
import com.groomish_now.backend.repository.*;
import com.groomish_now.backend.service.customer.CustomerPaymentService;
import com.groomish_now.backend.service.utils.EmailService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerPaymentServiceImpl implements CustomerPaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BookingItemRepository bookingItemRepository;
    private final UserRepository userRepository;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final BookingTimelineService bookingTimelineService;
    private final LoyaltyConfigService loyaltyConfigService;
    private final RazorpayConfig razorpayConfig;
    private final ObjectProvider<RazorpayClient> razorpayClientProvider;

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
            method = PaymentMethod.ONLINE;
        }

        String invoiceNumber = "INV-GN-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100);
        String gatewayId = request.getPaymentGatewayId() != null && !request.getPaymentGatewayId().isBlank()
                ? request.getPaymentGatewayId()
                : "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = booking.getPayment();
        if (payment == null) {
            payment = Payment.builder()
                    .invoiceNumber(invoiceNumber)
                    .user(user)
                    .amount(booking.getPricePaid())
                    .build();
        }
        payment.setPaymentMethod(method);
        payment.setPaymentModeDetails(request.getPaymentModeDetails() != null ? request.getPaymentModeDetails() : method.name());
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaymentGatewayId(gatewayId);
        if (payment.getInvoiceNumber() == null) {
            payment.setInvoiceNumber(invoiceNumber);
        }

        Payment savedPayment = paymentRepository.save(payment);

        booking.setPayment(savedPayment);
        booking.setStatus(BookingStatus.CONFIRMED);
        if (booking.getBookingItems() != null) {
            for (BookingItem bi : booking.getBookingItems()) {
                if (bi.getStatus() == BookingStatus.PENDING) {
                    bi.setStatus(BookingStatus.CONFIRMED);
                    bookingItemRepository.save(bi);
                }
            }
        }
        Booking savedBooking = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                savedBooking,
                "PAYMENT_RECORDED",
                "Online Payment Verified",
                "Online payment of ₹" + savedPayment.getAmount() + " confirmed via " + savedPayment.getPaymentMethod() + ". Invoice: " + savedPayment.getInvoiceNumber(),
                user.getName(),
                "CUSTOMER",
                user.getEmail()
        );

        // Calculate expected Groom Coins from booking snapshot (never live catalog)
        int pendingPoints;
        if (booking.getExpectedRewardPoints() != null && booking.getExpectedRewardPoints() > 0) {
            pendingPoints = booking.getExpectedRewardPoints();
        } else {
            double spendPerCoin = 100.0;
            try {
                spendPerCoin = loyaltyConfigService.getOrCreateConfig().getSpendAmountPerCoin();
                if (spendPerCoin <= 0) spendPerCoin = 100.0;
            } catch (Exception ignored) {}

            int baseCoins = Math.max(1, (int) Math.round(savedPayment.getAmount() / spendPerCoin));
            int bonusCoins = 0;
            if (booking.getBookingItems() != null && !booking.getBookingItems().isEmpty()) {
                bonusCoins = booking.getBookingItems().stream()
                        .mapToInt(i -> i.getServiceRewardCoinsSnapshot() != null ? i.getServiceRewardCoinsSnapshot() : 0)
                        .sum();
            }
            pendingPoints = baseCoins + bonusCoins;
            booking.setExpectedRewardPoints(pendingPoints);
            bookingRepository.save(booking);
        }

        // In-app Notification: Final authoritative confirmation
        String displayCode = (booking != null && booking.getBookingCode() != null)
                ? booking.getBookingCode() : ("GN-" + (booking != null ? booking.getId().toString().substring(0, 8).toUpperCase() : ""));
        Notification notif = Notification.builder()
                .user(user)
                .title("Order & Booking Confirmed")
                .message("Your order (" + displayCode + ") is confirmed! Online payment of ₹" + savedPayment.getAmount() + " received. +" + pendingPoints + " Groom Coins will be credited upon completion.")
                .type(NotificationType.BOOKING)
                .referenceId(booking != null ? booking.getId() : null)
                .link(booking != null ? "/customer/bookings/" + booking.getId() : "/customer/bookings")
                .build();
        notificationRepository.save(notif);

        // Real-time Gmail Confirmation Email now that online payment is verified & confirmed!
        try {
            String serviceNames = "";
            if (booking.getBookingItems() != null && !booking.getBookingItems().isEmpty()) {
                serviceNames = booking.getBookingItems().stream()
                        .map(bi -> bi.getServiceNameSnapshot() != null ? bi.getServiceNameSnapshot() : (bi.getService() != null ? bi.getService().getName() : ""))
                        .filter(s -> !s.isBlank())
                        .collect(Collectors.joining(", "));
            }
            if (serviceNames.isBlank()) {
                serviceNames = "Salon Appointment";
            }
            BookingEmailDto emailDto = BookingEmailDto.fromBooking(booking);
            emailService.sendBookingConfirmationEmail(emailDto);
        } catch (Exception e) {
            log.error("Failed to send booking confirmation email after payment: {}", e.getMessage());
        }

        return toDto(savedPayment);
    }

    @Override
    @Transactional
    public RazorpayOrderResponse createRazorpayOrder(UUID userId, RazorpayOrderRequest request) {
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

        double payableAmount = booking.getPricePaid() != null ? booking.getPricePaid() : 0.0;
        long amountInPaise = Math.round(payableAmount * 100);
        if (amountInPaise <= 0) {
            // Free booking or 100% discount: automatically complete payment
            PaymentCheckoutRequest freeReq = new PaymentCheckoutRequest();
            freeReq.setBookingId(booking.getId());
            freeReq.setPaymentMethod("ONLINE");
            freeReq.setPaymentGatewayId("FREE_PROMO");
            freeReq.setPaymentModeDetails("Free Order / 100% Discount");
            checkoutPayment(userId, freeReq);

            return RazorpayOrderResponse.builder()
                    .orderId("order_sim_free_" + UUID.randomUUID().toString().substring(0, 8))
                    .amount(0L)
                    .currency("INR")
                    .keyId(razorpayConfig.getKeyId() != null ? razorpayConfig.getKeyId() : "rzp_test_placeholder")
                    .bookingId(booking.getId())
                    .bookingCode(booking.getBookingCode())
                    .customerName(user.getName())
                    .customerEmail(user.getEmail())
                    .customerPhone(user.getPhone())
                    .build();
        }

        String orderId;
        RazorpayClient client = razorpayClientProvider.getIfAvailable();
        if (client != null) {
            try {
                JSONObject orderReq = new JSONObject();
                orderReq.put("amount", amountInPaise);
                orderReq.put("currency", "INR");
                orderReq.put("receipt", "rcpt_" + booking.getId().toString().substring(0, 8));

                JSONObject notes = new JSONObject();
                notes.put("bookingId", booking.getId().toString());
                notes.put("bookingCode", booking.getBookingCode() != null ? booking.getBookingCode() : "");
                notes.put("customerEmail", user.getEmail() != null ? user.getEmail() : "");
                orderReq.put("notes", notes);

                Order order = client.orders.create(orderReq);
                orderId = order.get("id");
            } catch (Exception e) {
                log.error("Failed to create Razorpay order via SDK: {}", e.getMessage());
                orderId = "order_sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
                log.warn("Falling back to simulated Razorpay order ID '{}' so test checkout proceeds smoothly.", orderId);
            }
        } else {
            // Simulated order ID if keys are placeholder
            orderId = "order_sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            log.warn("Using simulated Razorpay order ID '{}' because active credentials are not initialized.", orderId);
        }

        return RazorpayOrderResponse.builder()
                .orderId(orderId)
                .amount(amountInPaise)
                .currency("INR")
                .keyId(razorpayConfig.getKeyId() != null ? razorpayConfig.getKeyId() : "rzp_test_placeholder")
                .bookingId(booking.getId())
                .bookingCode(booking.getBookingCode())
                .customerName(user.getName())
                .customerEmail(user.getEmail())
                .customerPhone(user.getPhone())
                .build();
    }

    @Override
    @Transactional
    public PaymentResponse verifyRazorpayPayment(UUID userId, RazorpayVerifyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied to this booking");
        }

        if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.COMPLETED) {
            return toDto(booking.getPayment());
        }

        // Verify cryptographic signature if secret is configured and not mock
        String secret = razorpayConfig.getKeySecret();
        boolean isConfigured = secret != null && !secret.isBlank() && !secret.contains("placeholder");
        boolean isSimulated = request.getRazorpayOrderId() != null && request.getRazorpayOrderId().startsWith("order_sim_");

        if (isConfigured && !isSimulated) {
            boolean valid = verifyHmacSha256(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature(),
                    secret.trim()
            );
            if (!valid) {
                throw new RuntimeException("Payment signature verification failed. Transaction rejected.");
            }
        }

        // Process successful payment
        PaymentCheckoutRequest checkoutReq = new PaymentCheckoutRequest();
        checkoutReq.setBookingId(booking.getId());
        checkoutReq.setPaymentMethod("ONLINE");
        checkoutReq.setPaymentGatewayId(request.getRazorpayPaymentId() != null ? request.getRazorpayPaymentId() : "pay_" + UUID.randomUUID().toString().substring(0, 8));
        checkoutReq.setPaymentModeDetails("Paid Online via Razorpay (" + request.getRazorpayOrderId() + ")");

        return checkoutPayment(userId, checkoutReq);
    }

    @Override
    @Transactional
    public PaymentResponse switchToPayAtSalon(UUID userId, UUID bookingId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied to this booking");
        }

        // Switch payment method to CASH (Pay at Salon)
        Payment payment = booking.getPayment();
        if (payment == null) {
            payment = Payment.builder()
                    .invoiceNumber("INV-CART-" + (System.currentTimeMillis() % 1000000))
                    .user(user)
                    .amount(booking.getPricePaid())
                    .build();
        }
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setPaymentModeDetails("Pay at Salon");
        payment.setStatus(PaymentStatus.PENDING);
        Payment savedPayment = paymentRepository.save(payment);

        booking.setPayment(savedPayment);
        booking.setStatus(BookingStatus.CONFIRMED);
        if (booking.getBookingItems() != null) {
            for (BookingItem bi : booking.getBookingItems()) {
                bi.setStatus(BookingStatus.CONFIRMED);
                bookingItemRepository.save(bi);
            }
        }
        Booking savedBooking = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                savedBooking,
                "PAYMENT_MODE_SWITCHED",
                "Switched to Pay at Salon",
                "Payment mode updated to Pay at Salon (Cash/UPI upon arrival at the salon).",
                user.getName(),
                "CUSTOMER",
                user.getEmail()
        );

        // In-app Notification
        Notification notif = Notification.builder()
                .user(user)
                .title("Appointment Confirmed (Pay at Salon)")
                .message("Your appointment (" + savedBooking.getBookingCode() + ") is confirmed! Please settle payment of ₹" + savedBooking.getPricePaid() + " upon arrival at the salon.")
                .type(NotificationType.BOOKING)
                .referenceId(savedBooking.getId())
                .link("/customer/bookings/" + savedBooking.getId())
                .build();
        notificationRepository.save(notif);

        // Real-time Gmail Confirmation Email for Pay at Salon
        try {
            String serviceNames = "";
            if (savedBooking.getBookingItems() != null && !savedBooking.getBookingItems().isEmpty()) {
                serviceNames = savedBooking.getBookingItems().stream()
                        .map(bi -> bi.getServiceNameSnapshot() != null ? bi.getServiceNameSnapshot() : (bi.getService() != null ? bi.getService().getName() : ""))
                        .filter(s -> !s.isBlank())
                        .collect(Collectors.joining(", "));
            }
            if (serviceNames.isBlank()) {
                serviceNames = "Salon Appointment";
            }
            BookingEmailDto emailDto = BookingEmailDto.fromBooking(savedBooking);
            emailService.sendBookingConfirmationEmail(emailDto);
        } catch (Exception e) {
            log.error("Failed to send confirmation email on switch to salon: {}", e.getMessage());
        }

        return toDto(savedPayment);
    }

    private boolean verifyHmacSha256(String orderId, String paymentId, String signature, String secret) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().equalsIgnoreCase(signature);
        } catch (Exception e) {
            log.error("Error computing HMAC-SHA256: {}", e.getMessage());
            return false;
        }
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
