package com.loyalty_program_app.backend.service.customer;

import com.loyalty_program_app.backend.dto.referral.ReferralCodeResponse;
import com.loyalty_program_app.backend.dto.referral.ReferralResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerReferralService {

    ReferralCodeResponse getReferralCodeInfo(UUID userId);

    Page<ReferralResponse> getReferralHistory(UUID userId, Pageable pageable);
}
