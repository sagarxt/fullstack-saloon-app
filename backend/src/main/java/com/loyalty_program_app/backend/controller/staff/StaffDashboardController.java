package com.loyalty_program_app.backend.controller.staff;

import com.loyalty_program_app.backend.dto.staff.StaffDashboardResponse;
import com.loyalty_program_app.backend.service.staff.StaffDashboardService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/dashboard")
@RequiredArgsConstructor
public class StaffDashboardController {

    private final StaffDashboardService staffDashboardService;

    private UUID getStaffId(HttpServletRequest req) {
        return UUID.fromString((String) req.getAttribute("userId"));
    }

    @GetMapping
    public StaffDashboardResponse getDashboard(HttpServletRequest req) {
        return staffDashboardService.getDashboard(getStaffId(req));
    }
}
