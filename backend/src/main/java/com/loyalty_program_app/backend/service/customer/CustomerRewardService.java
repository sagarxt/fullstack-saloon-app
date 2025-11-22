package com.loyalty_program_app.backend.service.customer;

import com.loyalty_program_app.backend.dto.reward.RewardResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerRewardService {

    Page<RewardResponse> getAvailableRewards(UUID userId, Pageable pageable);

    Page<RewardResponse> getAllActiveRewards(Pageable pageable);

    RewardResponse redeemReward(UUID userId, UUID rewardId);
}
