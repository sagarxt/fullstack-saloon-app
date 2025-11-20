package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.model.PointsLedger;
import com.loyalty_program_app.backend.security.JwtTokenProvider;
import com.loyalty_program_app.backend.service.PointsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/points")
@RequiredArgsConstructor
public class CustomerPointsController {

    private final PointsService pointsService;
    private final JwtTokenProvider jwtProvider;

    @GetMapping("/balance")
    public int getBalance(@RequestHeader("Authorization") String token) {
        UUID userId = extractUser(token);
        return pointsService.getBalance(userId);
    }

    @GetMapping("/ledger")
    public List<PointsLedger> getLedger(@RequestHeader("Authorization") String token) {
        UUID userId = extractUser(token);
        return pointsService.getLedger(userId);
    }

    private UUID extractUser(String token) {
        String raw = token.replace("Bearer ", "");
        return UUID.fromString(jwtProvider.getUserId(raw));
    }
}
