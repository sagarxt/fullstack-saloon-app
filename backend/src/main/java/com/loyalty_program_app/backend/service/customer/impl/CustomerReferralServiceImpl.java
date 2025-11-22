package com.loyalty_program_app.backend.service.customer.impl;

import com.loyalty_program_app.backend.dto.referral.ReferralCodeResponse;
import com.loyalty_program_app.backend.dto.referral.ReferralResponse;
import com.loyalty_program_app.backend.model.Referral;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.ReferralRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.customer.CustomerReferralService;
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

        long total = referralRepository.findAll().stream()
                .filter(r -> r.getReferrer().getId().equals(userId))
                .count();

        long rewarded = referralRepository.findAll().stream()
                .filter(r -> r.getReferrer().getId().equals(userId))
                .filter(Referral::isRewardGiven)
                .count();

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
