package com.loyalty_program_app.backend.dto.points;

import lombok.Data;

@Data
public class PointsBalanceResponse {
    private Integer points;
    private Integer lifetimePoints;
    private String tier;
    private Integer pendingPoints;
}
