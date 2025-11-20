package com.loyalty_program_app.backend.dto.reward;

import lombok.Data;

@Data
public class RewardRequest {
    private String title;
    private String description;
    private Integer pointsRequired;
    private Boolean active;
}
