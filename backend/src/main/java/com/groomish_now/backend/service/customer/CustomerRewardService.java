package com.groomish_now.backend.service.customer;

import com.groomish_now.backend.dto.reward.RedeemedVoucherResponse;
import com.groomish_now.backend.dto.reward.RewardResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerRewardService {

    Page<RewardResponse> getAvailableRewards(UUID userId, Pageable pageable);

    Page<RewardResponse> getAllActiveRewards(Pageable pageable);

    RewardResponse redeemReward(UUID userId, UUID rewardId);

    java.util.List<RedeemedVoucherResponse> getMyVouchers(UUID userId);
}
