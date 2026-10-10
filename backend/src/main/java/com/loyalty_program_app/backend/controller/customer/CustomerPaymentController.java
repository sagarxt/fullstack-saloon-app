package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.payment.PaymentCheckoutRequest;
import com.loyalty_program_app.backend.dto.payment.PaymentResponse;
import com.loyalty_program_app.backend.security.CustomUserDetails;
import com.loyalty_program_app.backend.service.customer.CustomerPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/payments")
@RequiredArgsConstructor
public class CustomerPaymentController {

    private final CustomerPaymentService paymentService;

    private UUID getCurrentUserId(CustomUserDetails user, HttpServletRequest request) {
        if (user != null) {
            return user.getId();
        }
        Object attr = request.getAttribute("userId");
        if (attr != null) {
            return UUID.fromString(attr.toString());
        }
        throw new RuntimeException("Unauthorized");
    }

    @GetMapping
    public Page<PaymentResponse> getMyPayments(
            @AuthenticationPrincipal CustomUserDetails user,
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return paymentService.getMyPayments(getCurrentUserId(user, request), pageable);
    }

    @GetMapping("/{id}")
    public PaymentResponse getMyPayment(
            @AuthenticationPrincipal CustomUserDetails user,
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        return paymentService.getMyPayment(getCurrentUserId(user, request), id);
    }

    @PostMapping("/checkout")
    public ResponseEntity<PaymentResponse> checkoutPayment(
            @AuthenticationPrincipal CustomUserDetails user,
            HttpServletRequest request,
            @Valid @RequestBody PaymentCheckoutRequest checkoutRequest
    ) {
        UUID userId = getCurrentUserId(user, request);
        return ResponseEntity.ok(paymentService.checkoutPayment(userId, checkoutRequest));
    }
}
