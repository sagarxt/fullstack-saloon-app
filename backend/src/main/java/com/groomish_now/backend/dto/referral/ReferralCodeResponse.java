package com.groomish_now.backend.dto.referral;

import lombok.Data;

@Data
public class ReferralCodeResponse {
    private String referralCode;
    private Long totalReferrals;
    private Long rewardedReferrals;
}
