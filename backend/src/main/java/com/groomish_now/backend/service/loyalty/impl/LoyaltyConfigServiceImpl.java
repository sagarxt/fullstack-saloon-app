package com.groomish_now.backend.service.loyalty.impl;

import com.groomish_now.backend.dto.loyalty.LoyaltyConfigDto;
import com.groomish_now.backend.model.LoyaltyConfig;
import com.groomish_now.backend.repository.LoyaltyConfigRepository;
import com.groomish_now.backend.service.loyalty.LoyaltyConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LoyaltyConfigServiceImpl implements LoyaltyConfigService {

    private final LoyaltyConfigRepository configRepository;

    private static final Long SINGLETON_ID = 1L;

    @Override
    @Transactional
    public LoyaltyConfig getOrCreateConfig() {
        return configRepository.findById(SINGLETON_ID).orElseGet(() -> {
            LoyaltyConfig defaultConfig = LoyaltyConfig.builder()
                    .id(SINGLETON_ID)
                    .coinName("Groom Coin")
                    .coinIconUrl(null)
                    .spendAmountPerCoin(100.0)
                    .coinValueInInr(1.0)
                    .build();
            return configRepository.save(defaultConfig);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public LoyaltyConfigDto getConfigDto() {
        LoyaltyConfig config = configRepository.findById(SINGLETON_ID).orElse(null);
        if (config == null) {
            return LoyaltyConfigDto.builder()
                    .coinName("Groom Coin")
                    .coinIconUrl(null)
                    .spendAmountPerCoin(100.0)
                    .coinValueInInr(1.0)
                    .build();
        }
        return toDto(config);
    }

    @Override
    @Transactional
    public LoyaltyConfigDto updateConfig(LoyaltyConfigDto dto) {
        LoyaltyConfig config = getOrCreateConfig();

        if (dto.getCoinName() != null && !dto.getCoinName().isBlank()) {
            config.setCoinName(dto.getCoinName().trim());
        }
        if (dto.getCoinIconUrl() != null) {
            config.setCoinIconUrl(dto.getCoinIconUrl().trim().isEmpty() ? null : dto.getCoinIconUrl().trim());
        }
        if (dto.getSpendAmountPerCoin() != null && dto.getSpendAmountPerCoin() > 0) {
            config.setSpendAmountPerCoin(dto.getSpendAmountPerCoin());
        }
        if (dto.getCoinValueInInr() != null && dto.getCoinValueInInr() > 0) {
            config.setCoinValueInInr(dto.getCoinValueInInr());
        }

        LoyaltyConfig saved = configRepository.save(config);
        return toDto(saved);
    }

    private LoyaltyConfigDto toDto(LoyaltyConfig config) {
        return LoyaltyConfigDto.builder()
                .coinName(config.getCoinName() != null ? config.getCoinName() : "Groom Coin")
                .coinIconUrl(config.getCoinIconUrl())
                .spendAmountPerCoin(config.getSpendAmountPerCoin() != null ? config.getSpendAmountPerCoin() : 100.0)
                .coinValueInInr(config.getCoinValueInInr() != null ? config.getCoinValueInInr() : 1.0)
                .build();
    }
}
