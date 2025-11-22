package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.payment.PaymentResponse;
import com.loyalty_program_app.backend.service.interfaces.CustomerPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/payments")
@RequiredArgsConstructor
public class CustomerPaymentController {

    private final CustomerPaymentService paymentService;

    private UUID getCurrentUserId(HttpServletRequest request) {
        return UUID.fromString((String) request.getAttribute("userId"));
    }

    @GetMapping
    public Page<PaymentResponse> getMyPayments(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return paymentService.getMyPayments(getCurrentUserId(request), pageable);
    }

    @GetMapping("/{id}")
    public PaymentResponse getMyPayment(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        return paymentService.getMyPayment(getCurrentUserId(request), id);
    }
}
