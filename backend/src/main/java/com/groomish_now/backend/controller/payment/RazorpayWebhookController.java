package com.groomish_now.backend.controller.payment;

import com.groomish_now.backend.service.customer.CustomerPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Slf4j
public class RazorpayWebhookController {

    private final CustomerPaymentService paymentService;
    private final com.groomish_now.backend.config.RazorpayConfig razorpayConfig;

    /**
     * Handles incoming Razorpay webhook events for payment.captured, payment.failed, and order.paid.
     * When running in Test Mode or when webhooks are disabled, responds 200 OK without processing.
     */
    @PostMapping(value = {
            "/api/v1/payments/razorpay/webhook",
            "/api/v1/public/payments/razorpay/webhook"
    })
    public ResponseEntity<Map<String, Object>> handleRazorpayWebhook(
            @RequestBody(required = false) String rawPayload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        log.info("Razorpay webhook endpoint hit. Payload length: {}", rawPayload != null ? rawPayload.length() : 0);

        if (!razorpayConfig.isWebhookEnabled()) {
            log.info("Razorpay webhook functionality is currently DISABLED (Test mode). Returning 200 OK without processing.");
            return ResponseEntity.ok(Map.of(
                    "status", "disabled",
                    "message", "Razorpay webhooks are disabled in Test mode."
            ));
        }

        try {
            paymentService.handleRazorpayWebhook(rawPayload, signature);
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Razorpay webhook processed successfully"
            ));
        } catch (Exception ex) {
            log.error("Failed to process Razorpay webhook: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", "error",
                    "message", ex.getMessage() != null ? ex.getMessage() : "Webhook verification failed"
            ));
        }
    }
}
