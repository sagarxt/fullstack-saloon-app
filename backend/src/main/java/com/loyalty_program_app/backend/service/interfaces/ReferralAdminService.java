package com.loyalty_program_app.backend.service.interfaces;

import com.loyalty_program_app.backend.dto.referral.ReferralResponse;
import com.loyalty_program_app.backend.dto.referral.ReferralRewardRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ReferralAdminService {

    Page<ReferralResponse> searchReferrals(
            String referrerName,
            String referredName,
            Boolean rewardGiven,
            String fromDate,
            String toDate,
            Pageable pageable
    );

    ReferralResponse getReferralById(UUID id);

    ReferralResponse markReferralRewarded(UUID id, ReferralRewardRequest request);
}
