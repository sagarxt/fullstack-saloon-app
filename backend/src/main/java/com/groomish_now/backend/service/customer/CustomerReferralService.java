package com.groomish_now.backend.service.customer;

import com.groomish_now.backend.dto.referral.ReferralCodeResponse;
import com.groomish_now.backend.dto.referral.ReferralResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerReferralService {

    ReferralCodeResponse getReferralCodeInfo(UUID userId);

    Page<ReferralResponse> getReferralHistory(UUID userId, Pageable pageable);
}
