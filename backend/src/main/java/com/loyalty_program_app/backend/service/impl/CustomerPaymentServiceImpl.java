package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.payment.PaymentResponse;
import com.loyalty_program_app.backend.model.Payment;
import com.loyalty_program_app.backend.repository.PaymentRepository;
import com.loyalty_program_app.backend.service.interfaces.CustomerPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerPaymentServiceImpl implements CustomerPaymentService {

    private final PaymentRepository paymentRepository;

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
        dto.setCreatedAt(p.getCreatedAt().toString());
        return dto;
    }
}
