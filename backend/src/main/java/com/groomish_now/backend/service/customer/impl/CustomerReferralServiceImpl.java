package com.groomish_now.backend.service.customer.impl;

import com.groomish_now.backend.dto.referral.ReferralCodeResponse;
import com.groomish_now.backend.dto.referral.ReferralResponse;
import com.groomish_now.backend.model.Referral;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.ReferralRepository;
import com.groomish_now.backend.repository.UserRepository;
import com.groomish_now.backend.service.customer.CustomerReferralService;
import com.groomish_now.backend.util.ReferralCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerReferralServiceImpl implements CustomerReferralService {

    private final UserRepository userRepository;
    private final ReferralRepository referralRepository;

    @Override
    public ReferralCodeResponse getReferralCodeInfo(UUID userId) {

        User referrer = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (referrer.getReferralCode() == null || referrer.getReferralCode().isBlank()) {
            referrer.setReferralCode(ReferralCodeGenerator.generateUniqueReferralCode(referrer.getName(), userRepository));
            userRepository.save(referrer);
        }

        long total = referralRepository.countByReferrerId(userId);

        long rewarded = referralRepository.countByReferrerIdAndRewardGivenTrue(userId);

        ReferralCodeResponse dto = new ReferralCodeResponse();
        dto.setReferralCode(referrer.getReferralCode());
        dto.setTotalReferrals(total);
        dto.setRewardedReferrals(rewarded);
        return dto;
    }

    @Override
    public Page<ReferralResponse> getReferralHistory(UUID userId, Pageable pageable) {

        User referrer = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Page<Referral> page = referralRepository.findByReferrer(referrer, pageable);

        return page.map(this::toDto);
    }

    private ReferralResponse toDto(Referral r) {
        ReferralResponse dto = new ReferralResponse();
        dto.setId(r.getId());
        if (r.getReferrer() != null) {
            dto.setReferrerId(r.getReferrer().getId());
            dto.setReferrerName(r.getReferrer().getName());
            dto.setReferrerEmail(r.getReferrer().getEmail());
        }
        if (r.getReferred() != null) {
            dto.setReferredId(r.getReferred().getId());
            dto.setReferredName(r.getReferred().getName());
            dto.setReferredEmail(r.getReferred().getEmail());
        }
        dto.setRewardGiven(r.isRewardGiven());
        dto.setPointsLedgerId(r.getPointsLedger() != null ? r.getPointsLedger().getId() : null);
        dto.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
        return dto;
    }
}
