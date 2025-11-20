package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.enums.PointsReason;
import com.loyalty_program_app.backend.enums.RedemptionStatus;
import com.loyalty_program_app.backend.model.PointsLedger;
import com.loyalty_program_app.backend.model.Reward;
import com.loyalty_program_app.backend.model.Redemption;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.PointsLedgerRepository;
import com.loyalty_program_app.backend.repository.RewardRepository;
import com.loyalty_program_app.backend.repository.RedemptionRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RewardService {

    private final RewardRepository rewardRepository;
    private final RedemptionRepository redemptionRepository;
    private final UserRepository userRepository;
    private final PointsLedgerRepository ledgerRepository;

    public RewardService(RewardRepository rewardRepository,
                         RedemptionRepository redemptionRepository,
                         UserRepository userRepository,
                         PointsLedgerRepository ledgerRepository) {
        this.rewardRepository = rewardRepository;
        this.redemptionRepository = redemptionRepository;
        this.userRepository = userRepository;
        this.ledgerRepository = ledgerRepository;
    }

    public List<Reward> listActiveRewards() {
        return rewardRepository.findByActiveTrue();
    }

    @Transactional
    public Redemption redeem(UUID userId, UUID rewardId) {
        Reward reward = rewardRepository.findById(rewardId).orElseThrow(() -> new IllegalArgumentException("Reward not found"));
        if (!reward.getActive()) throw new IllegalArgumentException("Reward not active");

        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        int current = user.getPoints() == null ? 0 : user.getPoints();
        if (current < reward.getPointsRequired()) throw new IllegalArgumentException("Insufficient points");

        // deduct points
        user.setPoints(current - reward.getPointsRequired());
        userRepository.save(user);

        PointsLedger ledger = PointsLedger.builder()
                .userId(userId)
                .changeAmount(-reward.getPointsRequired())
                .reason(PointsReason.REWARD_REDEEMED)
                .relatedId(rewardId)
                .build();
        ledgerRepository.save(ledger);

        Redemption redemption = Redemption.builder()
                .userId(userId)
                .rewardId(rewardId)
                .pointsUsed(reward.getPointsRequired())
                .status(RedemptionStatus.REDEEMED)
                .build();
        return redemptionRepository.save(redemption);
    }
}
