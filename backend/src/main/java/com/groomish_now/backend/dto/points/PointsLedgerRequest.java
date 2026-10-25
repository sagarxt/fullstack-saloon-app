package com.groomish_now.backend.dto.points;

import lombok.Data;

@Data
public class PointsLedgerRequest {
    private String userId;
    private Integer changeAmount;      // +points or -points
    private String reason;             // ADMIN_ADJUST
    private String note;               // optional description
}
