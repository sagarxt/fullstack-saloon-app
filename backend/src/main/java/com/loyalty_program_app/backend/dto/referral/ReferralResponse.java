package com.loyalty_program_app.backend.dto.referral;

import lombok.Data;

import java.util.UUID;

@Data
public class ReferralResponse {
    private UUID id;

    private UUID referrerId;
    private String referrerName;
    private String referrerEmail;

    private UUID referredId;
    private String referredName;
    private String referredEmail;

    private Boolean rewardGiven;
    private UUID pointsLedgerId;
    private String createdAt;
}
