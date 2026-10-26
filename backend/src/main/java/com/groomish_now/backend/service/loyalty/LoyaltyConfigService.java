package com.groomish_now.backend.service.loyalty;

import com.groomish_now.backend.dto.loyalty.LoyaltyConfigDto;
import com.groomish_now.backend.enums.Tier;
import com.groomish_now.backend.model.LoyaltyConfig;

public interface LoyaltyConfigService {
    LoyaltyConfig getOrCreateConfig();
    LoyaltyConfigDto getConfigDto();
    LoyaltyConfigDto updateConfig(LoyaltyConfigDto dto);
    Tier calculateTier(int lifetimePoints, Tier currentTier);
}

