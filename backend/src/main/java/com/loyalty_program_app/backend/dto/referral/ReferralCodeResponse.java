package com.loyalty_program_app.backend.dto.referral;

import lombok.Data;

@Data
public class ReferralCodeResponse {
    private String referralCode;
    private Long totalReferrals;
    private Long rewardedReferrals;
}
