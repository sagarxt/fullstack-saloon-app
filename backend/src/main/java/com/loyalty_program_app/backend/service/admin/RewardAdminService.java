package com.loyalty_program_app.backend.service.admin;

import com.loyalty_program_app.backend.dto.reward.RewardRequest;
import com.loyalty_program_app.backend.dto.reward.RewardResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface RewardAdminService {

    RewardResponse createReward(RewardRequest request);

    RewardResponse updateReward(UUID id, RewardRequest request);

    void softDeleteReward(UUID id);

    RewardResponse getReward(UUID id);

    Page<RewardResponse> searchRewards(
            String title,
            Boolean active,
            Integer minPoints,
            Integer maxPoints,
            Boolean inStock,
            Pageable pageable
    );
}
