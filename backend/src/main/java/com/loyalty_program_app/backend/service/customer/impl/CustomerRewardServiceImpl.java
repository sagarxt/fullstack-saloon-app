package com.loyalty_program_app.backend.service.customer.impl;

import com.loyalty_program_app.backend.dto.reward.RewardResponse;
import com.loyalty_program_app.backend.enums.PointReason;
import com.loyalty_program_app.backend.model.PointsLedger;
import com.loyalty_program_app.backend.model.Reward;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.PointsLedgerRepository;
import com.loyalty_program_app.backend.repository.RewardRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.customer.CustomerRewardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerRewardServiceImpl implements CustomerRewardService {

    private final RewardRepository rewardRepository;
    private final UserRepository userRepository;
    private final PointsLedgerRepository pointsLedgerRepository;

    @Override
    public Page<RewardResponse> getAvailableRewards(UUID userId, Pageable pageable) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<RewardResponse> filtered = rewardRepository.findAll().stream()
                .filter(Reward::isActive)
                .filter(r -> r.getExpiryDate() == null || r.getExpiryDate().isAfter(LocalDateTime.now()))
                .filter(r -> r.getStock() == null || r.getStock() > 0)
                .filter(r -> r.getPointsRequired() != null && r.getPointsRequired() <= user.getPoints())
                .map(this::toDto)
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<RewardResponse> content = start > end ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(content, pageable, filtered.size());
    }

    @Override
    public Page<RewardResponse> getAllActiveRewards(Pageable pageable) {
        List<RewardResponse> filtered = rewardRepository.findAll().stream()
                .filter(Reward::isActive)
                .filter(r -> r.getExpiryDate() == null || r.getExpiryDate().isAfter(LocalDateTime.now()))
                .map(this::toDto)
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<RewardResponse> content = start > end ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(content, pageable, filtered.size());
    }

    @Override
    public RewardResponse redeemReward(UUID userId, UUID rewardId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new RuntimeException("Reward not found"));

        if (!reward.isActive()) {
            throw new RuntimeException("Reward is inactive");
        }
        if (reward.getExpiryDate() != null && reward.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reward expired");
        }
        if (reward.getStock() != null && reward.getStock() <= 0) {
            throw new RuntimeException("Reward out of stock");
        }
        if (reward.getPointsRequired() == null || user.getPoints() < reward.getPointsRequired()) {
            throw new RuntimeException("Not enough points to redeem");
        }

        int pointsToDeduct = reward.getPointsRequired();
        user.setPoints(user.getPoints() - pointsToDeduct);
        userRepository.save(user);

        PointsLedger ledger = new PointsLedger();
        ledger.setUser(user);
        ledger.setChangeAmount(-pointsToDeduct);
        ledger.setReason(PointReason.REWARD_REDEEM);
//        ledger.setNote("Redeemed reward: " + reward.getTitle());
        ledger.setCreatedAt(LocalDateTime.now());

        pointsLedgerRepository.save(ledger);

        if (reward.getStock() != null) {
            reward.setStock(reward.getStock() - 1);
            rewardRepository.save(reward);
        }

        return toDto(reward);
    }

    private RewardResponse toDto(Reward r) {
        RewardResponse dto = new RewardResponse();
        dto.setId(r.getId());
        dto.setTitle(r.getTitle());
        dto.setImage(r.getImage());
        dto.setDescription(r.getDescription());
        dto.setPointsRequired(r.getPointsRequired());
        dto.setStock(r.getStock());
        dto.setExpiryDate(r.getExpiryDate() != null ? r.getExpiryDate().toString() : null);
        dto.setActive(r.isActive());
        return dto;
    }
}
