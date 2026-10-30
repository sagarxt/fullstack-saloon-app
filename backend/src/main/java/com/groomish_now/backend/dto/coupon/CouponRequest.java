package com.groomish_now.backend.dto.coupon;

import lombok.Data;

@Data
public class CouponRequest {
    private String code;
    private String description;
    private Double minAmount;
    private Double maxDiscount;
    private Double discount;
    private String startDate; // ISO: 2026-10-15T00:00:00
    private String expiryDate; // ISO: 2025-01-25T00:00:00
    private Boolean active;
    private java.util.List<String> eligibleCategories;
    private java.util.List<String> eligibleBrands;
    private String categoryBrandOperator; // "OR" or "AND"
    private java.util.List<String> applicableUserGroups;
}
