package com.loyalty_program_app.backend.dto.points;

import lombok.Data;

@Data
public class PointsBalanceResponse {
    private Integer points;
    private String tier;
}
