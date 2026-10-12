package com.loyalty_program_app.backend.dto.reward;

import lombok.Data;

@Data
public class RewardRequest {
    private String title;
    private String image;
    private String description;
    private Integer pointsRequired;
    private Integer stock;
    private java.util.UUID serviceId;
    private String serviceName;
    private Integer discountPercent;
    private Integer validityDays;
    private String expiryDate;
    private Boolean active;
}
