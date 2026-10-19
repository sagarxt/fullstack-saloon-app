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
    private final com.loyalty_program_app.backend.repository.RedeemedVoucherRepository redeemedVoucherRepository;
    private final com.loyalty_program_app.backend.service.utils.EmailService emailService;
    private final com.loyalty_program_app.backend.repository.NotificationRepository notificationRepository;

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

        // Calculate voucher expiration date
        LocalDateTime expiresAt;
        if (reward.getValidityDays() != null && reward.getValidityDays() > 0) {
            expiresAt = LocalDateTime.now().plusDays(reward.getValidityDays());
        } else if (reward.getExpiryDate() != null) {
            expiresAt = reward.getExpiryDate();
        } else {
            expiresAt = LocalDateTime.now().plusDays(30);
        }

        // Generate clean unique voucher code
        String voucherCode = "VCH-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        // Create redeemed voucher
        com.loyalty_program_app.backend.model.RedeemedVoucher voucher = com.loyalty_program_app.backend.model.RedeemedVoucher.builder()
                .user(user)
                .reward(reward)
                .voucherCode(voucherCode)
                .title(reward.getTitle())
                .description(reward.getDescription())
                .image(reward.getImage())
                .serviceId(reward.getServiceId())
                .serviceName(reward.getServiceName())
                .discountPercent(reward.getDiscountPercent() != null ? reward.getDiscountPercent() : 100)
                .pointsSpent(pointsToDeduct)
                .status(com.loyalty_program_app.backend.enums.VoucherStatus.ACTIVE)
                .redeemedAt(LocalDateTime.now())
                .expiresAt(expiresAt)
                .build();
        voucher = redeemedVoucherRepository.save(voucher);

        // Record points in ledger
        PointsLedger ledger = new PointsLedger();
        ledger.setUser(user);
        ledger.setChangeAmount(-pointsToDeduct);
        ledger.setReason(PointReason.REWARD_REDEEM);
        ledger.setRelatedId(voucher.getId());
        ledger.setNote("Redeemed: " + reward.getTitle() + " (" + voucherCode + ")");
        ledger.setCreatedAt(LocalDateTime.now());
        pointsLedgerRepository.save(ledger);

        if (reward.getStock() != null) {
            reward.setStock(reward.getStock() - 1);
            rewardRepository.save(reward);
        }

        // In-app Notification
        com.loyalty_program_app.backend.model.Notification notif = com.loyalty_program_app.backend.model.Notification.builder()
                .user(user)
                .title("Reward Redeemed! 🎁")
                .message("You redeemed " + reward.getTitle() + " (Code: " + voucherCode + "). Valid until " + expiresAt.toLocalDate() + ".")
                .type(com.loyalty_program_app.backend.enums.NotificationType.OFFER)
                .build();
        notificationRepository.save(notif);

        // Real-time Rich Voucher Email
        String eligible = reward.getServiceName() != null && !reward.getServiceName().isBlank()
                ? reward.getServiceName() : "All Salon Services & Treatments";
        emailService.sendVoucherClaimedEmail(
                user.getEmail(),
                user.getName(),
                voucherCode,
                reward.getTitle(),
                reward.getDescription(),
                reward.getDiscountPercent() != null ? reward.getDiscountPercent() : 100,
                expiresAt,
                eligible
        );

        return toDto(reward);
    }

    @Override
    public List<com.loyalty_program_app.backend.dto.reward.RedeemedVoucherResponse> getMyVouchers(UUID userId) {
        List<com.loyalty_program_app.backend.model.RedeemedVoucher> list = redeemedVoucherRepository.findByUserIdOrderByCreatedAtDesc(userId);
        LocalDateTime now = LocalDateTime.now();

        return list.stream().map(v -> {
            com.loyalty_program_app.backend.dto.reward.RedeemedVoucherResponse dto = new com.loyalty_program_app.backend.dto.reward.RedeemedVoucherResponse();
            dto.setId(v.getId());
            dto.setVoucherCode(v.getVoucherCode());
            dto.setTitle(v.getTitle());
            dto.setDescription(v.getDescription());
            dto.setImage(v.getImage());
            dto.setServiceId(v.getServiceId());
            dto.setServiceName(v.getServiceName());
            dto.setDiscountPercent(v.getDiscountPercent());
            dto.setPointsSpent(v.getPointsSpent());

            if (v.getStatus() == com.loyalty_program_app.backend.enums.VoucherStatus.ACTIVE && v.getExpiresAt() != null && v.getExpiresAt().isBefore(now)) {
                dto.setStatus("EXPIRED");
            } else {
                dto.setStatus(v.getStatus().name());
            }

            dto.setRedeemedAt(v.getRedeemedAt() != null ? v.getRedeemedAt().toString() : null);
            dto.setExpiresAt(v.getExpiresAt() != null ? v.getExpiresAt().toString() : null);

            if (v.getExpiresAt() != null && v.getExpiresAt().isAfter(now)) {
                dto.setDaysRemaining(java.time.Duration.between(now, v.getExpiresAt()).toDays());
            } else {
                dto.setDaysRemaining(0L);
            }
            return dto;
        }).toList();
    }

    private RewardResponse toDto(Reward r) {
        RewardResponse dto = new RewardResponse();
        dto.setId(r.getId());
        dto.setTitle(r.getTitle());
        dto.setImage(r.getImage());
        dto.setDescription(r.getDescription());
        dto.setPointsRequired(r.getPointsRequired());
        dto.setStock(r.getStock());
        dto.setServiceId(r.getServiceId());
        dto.setServiceName(r.getServiceName());
        dto.setDiscountPercent(r.getDiscountPercent());
        dto.setValidityDays(r.getValidityDays());
        dto.setExpiryDate(r.getExpiryDate() != null ? r.getExpiryDate().toString() : null);
        dto.setActive(r.isActive());
        return dto;
    }
}
