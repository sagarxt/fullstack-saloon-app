package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.reward.RewardResponse;
import com.loyalty_program_app.backend.service.customer.CustomerRewardService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/rewards")
@RequiredArgsConstructor
public class CustomerRewardController {

    private final CustomerRewardService rewardService;

    private UUID getCurrentUserId(HttpServletRequest request) {
        return UUID.fromString((String) request.getAttribute("userId"));
    }

    @GetMapping("/available")
    public Page<RewardResponse> getAvailable(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return rewardService.getAvailableRewards(getCurrentUserId(request), pageable);
    }

    @GetMapping("/all")
    public Page<RewardResponse> getAllActive(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return rewardService.getAllActiveRewards(pageable);
    }

    @PostMapping("/redeem/{id}")
    public RewardResponse redeem(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        return rewardService.redeemReward(getCurrentUserId(request), id);
    }
}
