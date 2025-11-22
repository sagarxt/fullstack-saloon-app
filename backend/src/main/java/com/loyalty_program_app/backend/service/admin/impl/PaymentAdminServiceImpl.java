package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.payment.PaymentResponse;
import com.loyalty_program_app.backend.dto.payment.PaymentUpdateRequest;
import com.loyalty_program_app.backend.enums.PaymentStatus;
import com.loyalty_program_app.backend.model.Payment;
import com.loyalty_program_app.backend.repository.PaymentRepository;
import com.loyalty_program_app.backend.service.admin.PaymentAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentAdminServiceImpl implements PaymentAdminService {

    private final PaymentRepository paymentRepository;

    // ======================================
    // SEARCH PAYMENTS
    // ======================================
    @Override
    public Page<PaymentResponse> searchPayments(
            String invoiceNumber,
            String userName,
            String userEmail,
            String status,
            String fromDate,
            String toDate,
            Pageable pageable
    ) {

        List<Payment> all = paymentRepository.findAll();

        List<PaymentResponse> filtered = all.stream()
                .filter(p -> invoiceNumber == null ||
                        p.getInvoiceNumber().toLowerCase().contains(invoiceNumber.toLowerCase()))
                .filter(p -> userName == null ||
                        p.getUser().getName().toLowerCase().contains(userName.toLowerCase()))
                .filter(p -> userEmail == null ||
                        p.getUser().getEmail().toLowerCase().contains(userEmail.toLowerCase()))
                .filter(p -> status == null ||
                        p.getStatus().name().equalsIgnoreCase(status))
                .filter(p -> {
                    if (fromDate == null) return true;
                    LocalDateTime start = parseDate(fromDate).atStartOfDay();
                    return p.getCreatedAt().isAfter(start);
                })
                .filter(p -> {
                    if (toDate == null) return true;
                    LocalDateTime end = parseDate(toDate).atTime(23, 59, 59);
                    return p.getCreatedAt().isBefore(end);
                })
                .map(this::toDto)
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<PaymentResponse> content = start > end ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(content, pageable, filtered.size());
    }

    // ======================================
    // GET PAYMENT DETAILS
    // ======================================
    @Override
    public PaymentResponse getPayment(UUID id) {
        Payment p = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        return toDto(p);
    }

    // ======================================
    // UPDATE PAYMENT STATUS (including refund flag)
    // ======================================
    @Override
    public PaymentResponse updatePayment(UUID id, PaymentUpdateRequest request) {
        Payment p = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (request.getStatus() != null) {
            PaymentStatus newStatus = PaymentStatus.valueOf(request.getStatus());

            // REFUND LOGIC PLACEHOLDER
            if (newStatus == PaymentStatus.FAILED) {
                System.out.println("⚠ Placeholder: implement refund logic later");
            }

            p.setStatus(newStatus);
        }

        if (request.getPaymentModeDetails() != null) {
            p.setPaymentModeDetails(request.getPaymentModeDetails());
        }

        paymentRepository.save(p);

        return toDto(p);
    }

    // ======================================
    // UTIL METHODS
    // ======================================
    private LocalDate parseDate(String date) {
        try {
            return LocalDate.parse(date); // yyyy-MM-dd
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format: " + date);
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

        dto.setCreatedAt(p.getCreatedAt().toString());

        return dto;
    }
}
