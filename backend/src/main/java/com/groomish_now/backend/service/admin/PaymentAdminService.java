package com.groomish_now.backend.service.admin;

import com.groomish_now.backend.dto.payment.PaymentResponse;
import com.groomish_now.backend.dto.payment.PaymentUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface PaymentAdminService {

    Page<PaymentResponse> searchPayments(
            String invoiceNumber,
            String userName,
            String userEmail,
            String status,
            String fromDate,
            String toDate,
            Pageable pageable
    );

    PaymentResponse getPayment(UUID id);

    PaymentResponse updatePayment(UUID id, PaymentUpdateRequest request);
}
