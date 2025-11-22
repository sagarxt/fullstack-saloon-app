package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.reward.RewardRequest;
import com.loyalty_program_app.backend.dto.reward.RewardResponse;
import com.loyalty_program_app.backend.service.interfaces.RewardAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/rewards")
@RequiredArgsConstructor
public class RewardAdminController {

    private final RewardAdminService rewardAdminService;

    @PostMapping
    public RewardResponse createReward(@RequestBody RewardRequest request) {
        return rewardAdminService.createReward(request);
    }

    @PutMapping("/{id}")
    public RewardResponse updateReward(
            @PathVariable UUID id,
            @RequestBody RewardRequest request
    ) {
        return rewardAdminService.updateReward(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteReward(@PathVariable UUID id) {
        rewardAdminService.softDeleteReward(id);
    }

    @GetMapping("/{id}")
    public RewardResponse getReward(@PathVariable UUID id) {
        return rewardAdminService.getReward(id);
    }

    @GetMapping
    public Page<RewardResponse> searchRewards(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Integer minPoints,
            @RequestParam(required = false) Integer maxPoints,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return rewardAdminService.searchRewards(title, active, minPoints, maxPoints, inStock, pageable);
    }
}
