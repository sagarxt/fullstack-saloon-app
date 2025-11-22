package com.loyalty_program_app.backend.dto.points;

import lombok.Data;

import java.util.UUID;

@Data
public class PointsLedgerResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private Integer changeAmount;
    private String reason;
    private String note;
    private String createdAt;
}
