package com.loyalty_program_app.backend.service.admin;

import com.loyalty_program_app.backend.dto.payment.PaymentResponse;
import com.loyalty_program_app.backend.dto.payment.PaymentUpdateRequest;
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
