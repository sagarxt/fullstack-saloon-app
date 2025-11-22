package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.payment.PaymentResponse;
import com.loyalty_program_app.backend.dto.payment.PaymentUpdateRequest;
import com.loyalty_program_app.backend.service.interfaces.PaymentAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/payments")
@RequiredArgsConstructor
public class PaymentAdminController {

    private final PaymentAdminService paymentAdminService;

    @GetMapping
    public Page<PaymentResponse> searchPayments(
            @RequestParam(required = false) String invoiceNumber,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return paymentAdminService.searchPayments(
                invoiceNumber, userName, userEmail, status, fromDate, toDate, pageable
        );
    }

    @GetMapping("/{id}")
    public PaymentResponse getPayment(@PathVariable UUID id) {
        return paymentAdminService.getPayment(id);
    }

    @PutMapping("/{id}")
    public PaymentResponse updatePayment(
            @PathVariable UUID id,
            @RequestBody PaymentUpdateRequest request
    ) {
        return paymentAdminService.updatePayment(id, request);
    }
}
