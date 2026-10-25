package com.groomish_now.backend.controller.customer;

import com.groomish_now.backend.dto.points.PointsBalanceResponse;
import com.groomish_now.backend.dto.points.PointsLedgerResponse;
import com.groomish_now.backend.service.customer.CustomerPointsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/points")
@RequiredArgsConstructor
public class CustomerPointsController {

    private final CustomerPointsService pointsService;

    private UUID getCurrentUserId(HttpServletRequest request) {
        return UUID.fromString((String) request.getAttribute("userId"));
    }

    @GetMapping("/balance")
    public PointsBalanceResponse getBalance(HttpServletRequest request) {
        return pointsService.getBalance(getCurrentUserId(request));
    }

    @GetMapping("/history")
    public Page<PointsLedgerResponse> getHistory(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return pointsService.getHistory(getCurrentUserId(request), pageable);
    }
}
