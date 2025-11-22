package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.referral.ReferralResponse;
import com.loyalty_program_app.backend.dto.referral.ReferralRewardRequest;
import com.loyalty_program_app.backend.service.interfaces.ReferralAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/referrals")
@RequiredArgsConstructor
public class ReferralAdminController {

    private final ReferralAdminService referralAdminService;

    @GetMapping
    public Page<ReferralResponse> searchReferrals(
            @RequestParam(required = false) String referrerName,
            @RequestParam(required = false) String referredName,
            @RequestParam(required = false) Boolean rewardGiven,
            @RequestParam(required = false) String fromDate, // yyyy-MM-dd
            @RequestParam(required = false) String toDate,   // yyyy-MM-dd
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return referralAdminService.searchReferrals(
                referrerName, referredName, rewardGiven, fromDate, toDate, pageable
        );
    }

    @GetMapping("/{id}")
    public ReferralResponse getReferral(@PathVariable UUID id) {
        return referralAdminService.getReferralById(id);
    }

    @PostMapping("/{id}/reward")
    public ReferralResponse markRewarded(
            @PathVariable UUID id,
            @RequestBody ReferralRewardRequest request
    ) {
        return referralAdminService.markReferralRewarded(id, request);
    }
}
