package com.loyalty_program_app.backend.controller;

import com.loyalty_program_app.backend.model.Reward;
import com.loyalty_program_app.backend.model.Redemption;
import com.loyalty_program_app.backend.service.RewardService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rewards")
public class RewardController {

    private final RewardService rewardService;
    public RewardController(RewardService rewardService) { this.rewardService = rewardService; }

    @GetMapping
    public ResponseEntity<List<Reward>> listActive() {
        return ResponseEntity.ok(rewardService.listActiveRewards());
    }

    @PostMapping("/{id}/redeem")
    public ResponseEntity<?> redeem(@PathVariable("id") UUID rewardId, HttpServletRequest request) {
        String userIdStr = (String) request.getAttribute("userId");
        if (userIdStr == null) return ResponseEntity.status(401).body(java.util.Map.of("error","Unauthorized"));
        UUID userId = UUID.fromString(userIdStr);
        try {
            Redemption red = rewardService.redeem(userId, rewardId);
            return ResponseEntity.ok(red);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", ex.getMessage()));
        }
    }
}
