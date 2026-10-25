package com.groomish_now.backend.service.customer;

import com.groomish_now.backend.dto.payment.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerPaymentService {

    Page<PaymentResponse> getMyPayments(UUID userId, Pageable pageable);

    PaymentResponse getMyPayment(UUID userId, UUID paymentId);

    PaymentResponse checkoutPayment(UUID userId, PaymentCheckoutRequest request);

    RazorpayOrderResponse createRazorpayOrder(UUID userId, RazorpayOrderRequest request);

    PaymentResponse verifyRazorpayPayment(UUID userId, RazorpayVerifyRequest request);

    PaymentResponse switchToPayAtSalon(UUID userId, UUID bookingId);
}

