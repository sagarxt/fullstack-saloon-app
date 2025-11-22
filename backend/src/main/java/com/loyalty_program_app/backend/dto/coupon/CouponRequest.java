package com.loyalty_program_app.backend.dto.coupon;

import lombok.Data;

@Data
public class CouponRequest {
    private String code;
    private String description;
    private Double minAmount;
    private Double maxDiscount;
    private Double discount;
    private String expiryDate; // ISO: 2025-01-25T00:00:00
    private Boolean active;
}
