package com.loyalty_program_app.backend.dto.referral;

import lombok.Data;

@Data
public class ReferralRewardRequest {
    private Integer bonusPoints;  // e.g. 50, 100
    private String note;          // optional notes, will go into PointsLedger
}
