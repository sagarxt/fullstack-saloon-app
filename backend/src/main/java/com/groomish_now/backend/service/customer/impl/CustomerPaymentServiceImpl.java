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
import java.util.List;
import java.util.Optional;
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

        boolean isAlreadyCompleted = booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.COMPLETED;
        double confirmedPaid = isAlreadyCompleted
                ? (booking.getPayment().getAmount() != null ? booking.getPayment().getAmount() : (booking.getPricePaid() != null ? booking.getPricePaid() : 0.0))
                : 0.0;

        double payableRemaining;
        if (isAlreadyCompleted) {
            double total = booking.getTotalAmount() != null ? booking.getTotalAmount() : confirmedPaid;
            payableRemaining = Math.max(0.0, total - confirmedPaid);
            if (payableRemaining <= 0.01) {
                log.info("Idempotent check: Payment for booking {} has already been completed in full. Returning existing payment.", booking.getId());
                return toDto(booking.getPayment());
            }
        } else {
            if (booking.getPayment() != null && booking.getPayment().getAmount() != null && booking.getPayment().getAmount() > 0) {
                payableRemaining = booking.getPayment().getAmount();
            } else if (booking.getPricePaid() != null && booking.getPricePaid() > 0) {
                payableRemaining = booking.getPricePaid();
            } else {
                payableRemaining = booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0;
            }
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

        double newPaidTotal = confirmedPaid + payableRemaining;
        booking.setPricePaid(newPaidTotal);
        booking.setTotalAmount(newPaidTotal);

        Payment payment = booking.getPayment();
        if (payment == null) {
            payment = Payment.builder()
                    .invoiceNumber(invoiceNumber)
                    .user(user)
                    .amount(newPaidTotal)
                    .build();
        } else {
            payment.setAmount(newPaidTotal);
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

        String desc = confirmedPaid > 0
                ? "Online payment of remaining balance ₹" + payableRemaining + " confirmed via " + savedPayment.getPaymentMethod() + ". Total ₹" + newPaidTotal + " paid in full. Invoice: " + savedPayment.getInvoiceNumber()
                : "Online payment of ₹" + savedPayment.getAmount() + " confirmed via " + savedPayment.getPaymentMethod() + ". Invoice: " + savedPayment.getInvoiceNumber();

        bookingTimelineService.recordTimeline(
                savedBooking,
                "PAYMENT_RECORDED",
                confirmedPaid > 0 ? "Online Balance Payment Verified" : "Online Payment Verified",
                desc,
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

        boolean isAlreadyCompleted = booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.COMPLETED;
        double confirmedPaid = isAlreadyCompleted
                ? (booking.getPayment().getAmount() != null ? booking.getPayment().getAmount() : (booking.getPricePaid() != null ? booking.getPricePaid() : 0.0))
                : 0.0;

        double payableAmount;
        if (isAlreadyCompleted) {
            double total = booking.getTotalAmount() != null ? booking.getTotalAmount() : confirmedPaid;
            payableAmount = Math.max(0.0, total - confirmedPaid);
            if (payableAmount <= 0.01) {
                throw new RuntimeException("Payment has already been completed in full for this booking (no outstanding balance).");
            }
        } else {
            // Fresh / Pending booking: Nothing has been paid yet.
            // Determine net actual price:
            if (request.getAmount() != null && request.getAmount() > 0) {
                payableAmount = request.getAmount();
            } else if (booking.getPayment() != null && booking.getPayment().getAmount() != null && booking.getPayment().getAmount() > 0) {
                payableAmount = booking.getPayment().getAmount();
            } else if (booking.getPricePaid() != null && booking.getPricePaid() > 0) {
                payableAmount = booking.getPricePaid();
            } else {
                payableAmount = booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0;
            }
        }

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
        }

        // Link razorpayOrderId immediately to booking and pending payment for webhook matching
        booking.setRazorpayOrderId(orderId);
        Payment pendingPayment = booking.getPayment();
        if (pendingPayment == null) {
            String invoiceNumber = "INV-GN-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100);
            pendingPayment = Payment.builder()
                    .invoiceNumber(invoiceNumber)
                    .user(user)
                    .amount(payableAmount)
                    .paymentMethod(PaymentMethod.ONLINE)
                    .status(PaymentStatus.PENDING)
                    .razorpayOrderId(orderId)
                    .paymentModeDetails("Razorpay Order Created (" + orderId + ")")
                    .build();
            pendingPayment = paymentRepository.save(pendingPayment);
            booking.setPayment(pendingPayment);
        } else {
            pendingPayment.setRazorpayOrderId(orderId);
            paymentRepository.save(pendingPayment);
        }
        bookingRepository.save(booking);

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

        PaymentResponse response = checkoutPayment(userId, checkoutReq);

        // Update Razorpay fields on payment entity
        if (booking.getPayment() != null) {
            Payment p = booking.getPayment();
            p.setRazorpayOrderId(request.getRazorpayOrderId());
            p.setRazorpayPaymentId(request.getRazorpayPaymentId());
            p.setRazorpaySignature(request.getRazorpaySignature());
            p.setPaidAt(LocalDateTime.now());
            paymentRepository.save(p);
        }

        return response;
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

    // ==========================================
    // RAZORPAY WEBHOOK PROCESSING
    // ==========================================
    @Override
    @Transactional
    public void handleRazorpayWebhook(String payload, String signature) {
        if (!razorpayConfig.isWebhookEnabled()) {
            log.info("Razorpay webhooks are disabled (Test mode). Skipping webhook payload processing.");
            return;
        }

        log.info("Received Razorpay webhook. Signature header present: {}", signature != null);

        String secret = razorpayConfig.getWebhookSecret();
        boolean hasSecret = secret != null && !secret.isBlank() && !secret.contains("placeholder");

        if (hasSecret) {
            boolean valid = verifyWebhookSignature(payload, signature, secret.trim());
            if (!valid) {
                log.error("Invalid Razorpay webhook signature! Verification failed. Provided: {}", signature);
                throw new RuntimeException("Invalid Razorpay webhook signature");
            }
            log.info("✔ Razorpay webhook signature verified successfully.");
        } else {
            log.warn("RAZORPAY_WEBHOOK_SECRET is not configured. Webhook event accepted without cryptographic validation.");
        }

        try {
            JSONObject json = new JSONObject(payload);
            String event = json.optString("event");
            log.info("Processing Razorpay webhook event: {}", event);

            JSONObject payloadObj = json.optJSONObject("payload");
            if (payloadObj == null) {
                log.warn("Webhook payload does not contain 'payload' node.");
                return;
            }

            if ("payment.captured".equals(event) || "order.paid".equals(event)) {
                handlePaymentCapturedWebhook(payloadObj);
            } else if ("payment.failed".equals(event)) {
                handlePaymentFailedWebhook(payloadObj);
            } else if (event != null && event.startsWith("refund.")) {
                handleRefundWebhook(event, payloadObj);
            } else {
                log.info("Ignoring Razorpay webhook event '{}' (not payment.captured, payment.failed, or refund.*).", event);
            }
        } catch (Exception e) {
            log.error("Error while processing Razorpay webhook event: {}", e.getMessage(), e);
            throw new RuntimeException("Webhook processing error: " + e.getMessage());
        }
    }

    private void handleRefundWebhook(String event, JSONObject payloadObj) {
        JSONObject refundObj = payloadObj.optJSONObject("refund");
        JSONObject entity = refundObj != null ? refundObj.optJSONObject("entity") : null;
        if (entity == null) {
            log.warn("refund webhook payload missing refund.entity");
            return;
        }

        String refundId = entity.optString("id");
        String paymentId = entity.optString("payment_id");
        String status = entity.optString("status");
        long amountPaise = entity.optLong("amount", 0);
        double amount = amountPaise / 100.0;
        JSONObject acquirerData = entity.optJSONObject("acquirer_data");
        String arn = acquirerData != null ? acquirerData.optString("arn", null) : null;
        JSONObject notes = entity.optJSONObject("notes");
        String bookingIdStr = notes != null ? notes.optString("bookingId", null) : null;

        log.info("Webhook {}: refundId={}, paymentId={}, status={}, amount={}, arn={}",
                event, refundId, paymentId, status, amount, arn);

        Booking booking = findBookingForWebhook(null, bookingIdStr, paymentId);
        if (booking == null && refundId != null) {
            booking = bookingRepository.findAll().stream()
                    .filter(b -> refundId.equals(b.getRazorpayRefundId()))
                    .findFirst().orElse(null);
        }

        if (booking == null) {
            log.warn("Could not find matching Booking for Razorpay refund webhook: refundId={}, paymentId={}", refundId, paymentId);
            return;
        }

        String mappedStatus = "processed".equalsIgnoreCase(status) ? "PROCESSED" :
                              ("failed".equalsIgnoreCase(status) ? "FAILED" : (status != null ? status.toUpperCase() : "PROCESSED"));

        booking.setRefundStatus(mappedStatus);
        if (arn != null && !arn.isBlank()) {
            booking.setRefundArn(arn);
        }
        if (booking.getRazorpayRefundId() == null || booking.getRazorpayRefundId().isBlank()) {
            booking.setRazorpayRefundId(refundId);
        }
        if (amount > 0 && (booking.getRefundAmount() == null || booking.getRefundAmount() <= 0)) {
            booking.setRefundAmount(amount);
        }
        bookingRepository.save(booking);

        if (booking.getPayment() != null) {
            Payment p = booking.getPayment();
            p.setRefundStatus(mappedStatus);
            if (arn != null && !arn.isBlank()) p.setRefundArn(arn);
            if (p.getRazorpayRefundId() == null) p.setRazorpayRefundId(refundId);
            if (amount > 0 && (p.getRefundedAmount() == null || p.getRefundedAmount() <= 0)) p.setRefundedAmount(amount);
            paymentRepository.save(p);
        }

        bookingTimelineService.recordTimeline(
                booking,
                "REFUND_" + mappedStatus,
                "Razorpay Refund " + mappedStatus,
                "Refund " + refundId + " for ₹" + amount + " is " + mappedStatus + (arn != null ? ". Bank ARN: " + arn : ""),
                "Razorpay Gateway",
                "SYSTEM",
                null
        );
    }

    private void handlePaymentCapturedWebhook(JSONObject payloadObj) {
        JSONObject paymentObj = payloadObj.optJSONObject("payment");
        JSONObject entity = paymentObj != null ? paymentObj.optJSONObject("entity") : null;
        if (entity == null) {
            log.warn("payment.captured webhook payload missing payment.entity");
            return;
        }

        String paymentId = entity.optString("id");
        String orderId = entity.optString("order_id");
        long amountPaise = entity.optLong("amount", 0);
        double amount = amountPaise / 100.0;
        String method = entity.optString("method", "ONLINE");
        JSONObject notes = entity.optJSONObject("notes");
        String bookingIdStr = notes != null ? notes.optString("bookingId", null) : null;

        log.info("Webhook payment.captured: paymentId={}, orderId={}, amount={}, bookingId={}",
                paymentId, orderId, amount, bookingIdStr);

        Booking booking = findBookingForWebhook(orderId, bookingIdStr, paymentId);
        if (booking == null) {
            log.error("Could not find matching Booking for Razorpay paymentId={}, orderId={}, bookingId={}",
                    paymentId, orderId, bookingIdStr);
            return;
        }

        // Idempotency: If payment is already COMPLETED, skip duplicate processing!
        Payment existingPayment = booking.getPayment();
        if (existingPayment != null && existingPayment.getStatus() == PaymentStatus.COMPLETED) {
            log.info("Idempotent check passed: Booking {} payment is already COMPLETED. Skipping duplicate coins/email.", booking.getId());
            return;
        }

        // Process confirmation
        PaymentCheckoutRequest checkoutReq = new PaymentCheckoutRequest();
        checkoutReq.setBookingId(booking.getId());
        checkoutReq.setPaymentMethod(method.toUpperCase());
        checkoutReq.setPaymentGatewayId(paymentId != null && !paymentId.isBlank() ? paymentId : "pay_" + UUID.randomUUID().toString().substring(0, 8));
        checkoutReq.setPaymentModeDetails("Paid Online via Razorpay Webhook (" + orderId + ")");

        checkoutPayment(booking.getUser().getId(), checkoutReq);

        // Update Razorpay tracking fields
        if (booking.getPayment() != null) {
            Payment p = booking.getPayment();
            p.setRazorpayOrderId(orderId);
            p.setRazorpayPaymentId(paymentId);
            p.setPaidAt(LocalDateTime.now());
            paymentRepository.save(p);
        }
        if (booking.getRazorpayOrderId() == null && orderId != null) {
            booking.setRazorpayOrderId(orderId);
            bookingRepository.save(booking);
        }

        log.info("Booking {} successfully confirmed via Razorpay webhook!", booking.getId());
    }

    private void handlePaymentFailedWebhook(JSONObject payloadObj) {
        JSONObject paymentObj = payloadObj.optJSONObject("payment");
        JSONObject entity = paymentObj != null ? paymentObj.optJSONObject("entity") : null;
        if (entity == null) return;

        String paymentId = entity.optString("id");
        String orderId = entity.optString("order_id");
        String errorDesc = entity.optString("error_description", "Payment failed or was cancelled by user");
        JSONObject notes = entity.optJSONObject("notes");
        String bookingIdStr = notes != null ? notes.optString("bookingId", null) : null;

        log.warn("Webhook payment.failed: paymentId={}, orderId={}, error={}", paymentId, orderId, errorDesc);

        Booking booking = findBookingForWebhook(orderId, bookingIdStr, paymentId);
        if (booking == null) return;

        // Never downgrade an already completed booking or payment
        if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.COMPLETED) {
            log.info("Booking {} is already COMPLETED. Ignoring payment.failed event for {}", booking.getId(), paymentId);
            return;
        }

        Payment payment = booking.getPayment();
        if (payment == null) {
            payment = Payment.builder()
                    .invoiceNumber("INV-FAIL-" + (System.currentTimeMillis() % 1000000))
                    .user(booking.getUser())
                    .amount(booking.getTotalAmount())
                    .build();
        }
        payment.setStatus(PaymentStatus.FAILED);
        payment.setPaymentMethod(PaymentMethod.ONLINE);
        payment.setPaymentGatewayId(paymentId);
        payment.setRazorpayOrderId(orderId);
        payment.setRazorpayPaymentId(paymentId);
        payment.setPaymentModeDetails("Failed: " + errorDesc);
        Payment saved = paymentRepository.save(payment);

        booking.setPayment(saved);
        bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                booking,
                "PAYMENT_FAILED",
                "Online Payment Failed",
                "Razorpay transaction failed: " + errorDesc,
                booking.getUser().getName(),
                "SYSTEM",
                booking.getUser().getEmail()
        );
    }

    private Booking findBookingForWebhook(String orderId, String bookingIdStr, String paymentId) {
        // 1. Match by razorpayOrderId on Booking
        if (orderId != null && !orderId.isBlank()) {
            Optional<Booking> byOrder = bookingRepository.findByRazorpayOrderId(orderId.trim());
            if (byOrder.isPresent()) return byOrder.get();

            // 1b. Match by razorpayOrderId on Payment
            Optional<Payment> pByOrder = paymentRepository.findByRazorpayOrderId(orderId.trim());
            if (pByOrder.isPresent()) {
                List<Booking> userBookings = bookingRepository.findByUserId(pByOrder.get().getUser().getId());
                for (Booking b : userBookings) {
                    if (b.getPayment() != null && b.getPayment().getId().equals(pByOrder.get().getId())) {
                        return b;
                    }
                }
            }
        }

        // 2. Match by notes.bookingId
        if (bookingIdStr != null && !bookingIdStr.isBlank()) {
            try {
                UUID bId = UUID.fromString(bookingIdStr.trim());
                Optional<Booking> byId = bookingRepository.findById(bId);
                if (byId.isPresent()) return byId.get();
            } catch (Exception ignored) {}
        }

        // 3. Match by paymentGatewayId on Payment
        if (paymentId != null && !paymentId.isBlank()) {
            Optional<Payment> pByGateway = paymentRepository.findByPaymentGatewayId(paymentId.trim());
            if (pByGateway.isPresent()) {
                List<Booking> userBookings = bookingRepository.findByUserId(pByGateway.get().getUser().getId());
                for (Booking b : userBookings) {
                    if (b.getPayment() != null && b.getPayment().getId().equals(pByGateway.get().getId())) {
                        return b;
                    }
                }
            }
        }

        return null;
    }

    private boolean verifyWebhookSignature(String rawPayload, String signature, String secret) {
        if (signature == null || signature.isBlank() || secret == null || secret.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.trim().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String calculated = hexString.toString();
            return java.security.MessageDigest.isEqual(
                    calculated.getBytes(StandardCharsets.UTF_8),
                    signature.trim().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Error computing webhook HMAC-SHA256: {}", e.getMessage());
            return false;
        }
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
