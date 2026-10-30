package com.groomish_now.backend.dto.reward;

import lombok.Data;
import java.util.UUID;

@Data
public class RewardResponse {
    private UUID id;
    private String title;
    private String image;
    private String description;
    private Integer pointsRequired;
    private Integer stock;
    private UUID serviceId;
    private String serviceName;
    private UUID productId;
    private String productName;
    private String targetType;
    private String conditionOperator;
    private Integer discountPercent;
    private Double discountAmount;
    private Integer validityDays;
    private java.util.List<String> eligibleCategories;
    private java.util.List<String> eligibleBrands;
    private String expiryDate;
    private Boolean active;
}
