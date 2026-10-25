package com.groomish_now.backend.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayOrderResponse {
    private String orderId;
    private Long amount; // in paise (e.g. 50000 = Rs. 500.00)
    private String currency; // "INR"
    private String keyId; // Razorpay public key ID
    private UUID bookingId;
    private String bookingCode;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
}
