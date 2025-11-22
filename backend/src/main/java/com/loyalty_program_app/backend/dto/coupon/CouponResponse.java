package com.loyalty_program_app.backend.dto.coupon;

import lombok.Data;

import java.util.UUID;

@Data
public class CouponResponse {
    private UUID id;
    private String code;
    private String description;
    private Double minAmount;
    private Double maxDiscount;
    private Double discount;
    private String expiryDate;
    private Boolean active;
}
