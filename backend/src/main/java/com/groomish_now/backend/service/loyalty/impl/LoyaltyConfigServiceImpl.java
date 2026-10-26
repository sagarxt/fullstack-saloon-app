package com.groomish_now.backend.service.loyalty.impl;

import com.groomish_now.backend.dto.loyalty.LoyaltyConfigDto;
import com.groomish_now.backend.enums.Tier;
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
                    .silverMinPoints(0)
                    .goldMinPoints(50)
                    .platinumMinPoints(150)
                    .diamondMinPoints(300)
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
                    .silverMinPoints(0)
                    .goldMinPoints(50)
                    .platinumMinPoints(150)
                    .diamondMinPoints(300)
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
        if (dto.getSilverMinPoints() != null && dto.getSilverMinPoints() >= 0) {
            config.setSilverMinPoints(dto.getSilverMinPoints());
        }
        if (dto.getGoldMinPoints() != null && dto.getGoldMinPoints() > 0) {
            config.setGoldMinPoints(dto.getGoldMinPoints());
        }
        if (dto.getPlatinumMinPoints() != null && dto.getPlatinumMinPoints() > 0) {
            config.setPlatinumMinPoints(dto.getPlatinumMinPoints());
        }
        if (dto.getDiamondMinPoints() != null && dto.getDiamondMinPoints() > 0) {
            config.setDiamondMinPoints(dto.getDiamondMinPoints());
        }

        LoyaltyConfig saved = configRepository.save(config);
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Tier calculateTier(int lifetimePoints, Tier currentTier) {
        LoyaltyConfig config = getOrCreateConfig();
        int goldThreshold = config.getGoldMinPoints() != null ? config.getGoldMinPoints() : 50;
        int platinumThreshold = config.getPlatinumMinPoints() != null ? config.getPlatinumMinPoints() : 150;
        int diamondThreshold = config.getDiamondMinPoints() != null ? config.getDiamondMinPoints() : 300;

        Tier calculatedTier;
        if (lifetimePoints >= diamondThreshold) {
            calculatedTier = Tier.DIAMOND;
        } else if (lifetimePoints >= platinumThreshold) {
            calculatedTier = Tier.PLATINUM;
        } else if (lifetimePoints >= goldThreshold) {
            calculatedTier = Tier.GOLD;
        } else {
            calculatedTier = Tier.SILVER;
        }

        // Grandfathering: If user already reached a higher tier, do not downgrade
        if (currentTier != null && currentTier.ordinal() > calculatedTier.ordinal()) {
            return currentTier;
        }
        return calculatedTier;
    }

    private LoyaltyConfigDto toDto(LoyaltyConfig config) {
        return LoyaltyConfigDto.builder()
                .coinName(config.getCoinName() != null ? config.getCoinName() : "Groom Coin")
                .coinIconUrl(config.getCoinIconUrl())
                .spendAmountPerCoin(config.getSpendAmountPerCoin() != null ? config.getSpendAmountPerCoin() : 100.0)
                .coinValueInInr(config.getCoinValueInInr() != null ? config.getCoinValueInInr() : 1.0)
                .silverMinPoints(config.getSilverMinPoints() != null ? config.getSilverMinPoints() : 0)
                .goldMinPoints(config.getGoldMinPoints() != null ? config.getGoldMinPoints() : 50)
                .platinumMinPoints(config.getPlatinumMinPoints() != null ? config.getPlatinumMinPoints() : 150)
                .diamondMinPoints(config.getDiamondMinPoints() != null ? config.getDiamondMinPoints() : 300)
                .build();
    }
}

