package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.referral.ReferralResponse;
import com.loyalty_program_app.backend.dto.referral.ReferralRewardRequest;
import com.loyalty_program_app.backend.enums.PointReason;
import com.loyalty_program_app.backend.model.PointsLedger;
import com.loyalty_program_app.backend.model.Referral;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.PointsLedgerRepository;
import com.loyalty_program_app.backend.repository.ReferralRepository;
import com.loyalty_program_app.backend.service.admin.ReferralAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReferralAdminServiceImpl implements ReferralAdminService {

    private final ReferralRepository referralRepository;
    private final PointsLedgerRepository pointsLedgerRepository;

    // ================== SEARCH ==================
    @Override
    public Page<ReferralResponse> searchReferrals(
            String referrerName,
            String referredName,
            Boolean rewardGiven,
            String fromDate,
            String toDate,
            Pageable pageable
    ) {
        List<Referral> all = referralRepository.findAll();

        List<ReferralResponse> filtered = all.stream()
                .filter(r -> referrerName == null ||
                        r.getReferrer().getName().toLowerCase().contains(referrerName.toLowerCase()))
                .filter(r -> referredName == null ||
                        r.getReferred().getName().toLowerCase().contains(referredName.toLowerCase()))
                .filter(r -> rewardGiven == null || r.isRewardGiven() == rewardGiven)
                .filter(r -> {
                    if (fromDate == null) return true;
                    LocalDateTime start = parseDate(fromDate).atStartOfDay();
                    return r.getCreatedAt() != null && r.getCreatedAt().isAfter(start);
                })
                .filter(r -> {
                    if (toDate == null) return true;
                    LocalDateTime end = parseDate(toDate).atTime(23, 59, 59);
                    return r.getCreatedAt() != null && r.getCreatedAt().isBefore(end);
                })
                .map(this::toDto)
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<ReferralResponse> content = start > end ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(content, pageable, filtered.size());
    }

    // ================== GET ONE ==================
    @Override
    public ReferralResponse getReferralById(UUID id) {
        Referral r = referralRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Referral not found"));
        return toDto(r);
    }

    // ================== MARK REWARDED ==================
    @Override
    public ReferralResponse markReferralRewarded(UUID id, ReferralRewardRequest request) {
        Referral r = referralRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Referral not found"));

        if (r.isRewardGiven()) {
            throw new RuntimeException("Reward already given for this referral");
        }

        int bonusPoints = request.getBonusPoints() != null ? request.getBonusPoints() : 0;
        if (bonusPoints <= 0) {
            throw new RuntimeException("Bonus points must be greater than 0");
        }

        User referrer = r.getReferrer();
        referrer.setPoints(referrer.getPoints() + bonusPoints);

        // If you have a UserRepository, better to save explicitly:
        // userRepository.save(referrer);

        PointsLedger ledger = new PointsLedger();
        ledger.setUser(referrer);
        ledger.setChangeAmount(bonusPoints);
        ledger.setReason(PointReason.REFERRAL_BONUS);
        ledger.setCreatedAt(LocalDateTime.now());

        pointsLedgerRepository.save(ledger);

        r.setRewardGiven(true);
        r.setPointsLedger(ledger);

        referralRepository.save(r);

        return toDto(r);
    }


    // ================== UTIL ==================

    private LocalDate parseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr); // yyyy-MM-dd
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format: " + dateStr);
        }
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

    private int bonusPoints() {
        // placeholder; use request param directly - see above, using bonusPoints variable
        return 0;
    }
}
