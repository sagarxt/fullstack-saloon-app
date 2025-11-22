package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.dashboard.DashboardResponse;
import com.loyalty_program_app.backend.service.admin.DashboardAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class DashboardAdminController {

    private final DashboardAdminService dashboardAdminService;

    @GetMapping
    public DashboardResponse getDashboardData() {
        return dashboardAdminService.getDashboardData();
    }
}
