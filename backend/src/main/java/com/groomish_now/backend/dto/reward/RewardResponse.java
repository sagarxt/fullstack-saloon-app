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
    private Integer discountPercent;
    private Integer validityDays;
    private String expiryDate;
    private Boolean active;
}
