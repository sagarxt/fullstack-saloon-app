package com.loyalty_program_app.backend.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartCheckoutRequest {
    private LocalDateTime scheduledAt;
    private UUID storeId;
    private String couponCode;
    private String voucherCode;
    private String paymentMethod; // CASH, UPI, CARD
    private String note;
}
