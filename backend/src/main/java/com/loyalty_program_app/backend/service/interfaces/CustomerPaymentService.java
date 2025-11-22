package com.loyalty_program_app.backend.service.interfaces;

import com.loyalty_program_app.backend.dto.payment.PaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerPaymentService {

    Page<PaymentResponse> getMyPayments(UUID userId, Pageable pageable);

    PaymentResponse getMyPayment(UUID userId, UUID paymentId);
}

