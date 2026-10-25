package com.groomish_now.backend.controller.admin;

import com.groomish_now.backend.dto.dashboard.DashboardResponse;
import com.groomish_now.backend.service.admin.DashboardAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardAdminService dashboardAdminService;

    @GetMapping
    public DashboardResponse getDashboardData() {
        return dashboardAdminService.getDashboardData();
    }
}
