package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.customer.CustomerDashboardResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/dashboard")
@RequiredArgsConstructor
public class CustomerDashboardController {

    private final CustomerDashboardService dashboardService;

    @GetMapping
    public CustomerDashboardResponse getDashboard(HttpServletRequest request) {
        UUID userId = UUID.fromString((String) request.getAttribute("userId"));
        return dashboardService.getDashboard(userId);
    }
}

