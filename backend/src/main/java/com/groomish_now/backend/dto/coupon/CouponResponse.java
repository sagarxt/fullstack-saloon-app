package com.groomish_now.backend.dto.coupon;

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
    private String startDate;
    private String expiryDate;
    private Boolean active;
    private java.util.List<String> eligibleCategories;
    private java.util.List<String> eligibleBrands;
    private String categoryBrandOperator;
    private java.util.List<String> applicableUserGroups;
}
