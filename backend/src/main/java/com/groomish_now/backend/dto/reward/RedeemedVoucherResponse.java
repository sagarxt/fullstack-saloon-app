package com.groomish_now.backend.dto.reward;

import lombok.Data;

import java.util.UUID;

@Data
public class RedeemedVoucherResponse {
    private UUID id;
    private String voucherCode;
    private String title;
    private String description;
    private String image;

    private UUID serviceId;
    private String serviceName;
    private Integer discountPercent;

    private Integer pointsSpent;
    private String status;

    private String redeemedAt;
    private String expiresAt;
    private Long daysRemaining;
}
