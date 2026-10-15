package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.dto.loyalty.LoyaltyConfigDto;
import com.loyalty_program_app.backend.model.LoyaltyConfig;

public interface LoyaltyConfigService {
    LoyaltyConfig getOrCreateConfig();
    LoyaltyConfigDto getConfigDto();
    LoyaltyConfigDto updateConfig(LoyaltyConfigDto dto);
}
