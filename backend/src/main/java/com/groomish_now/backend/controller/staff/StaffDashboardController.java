package com.groomish_now.backend.controller.staff;

import com.groomish_now.backend.dto.staff.StaffAnalyticsResponse;
import com.groomish_now.backend.dto.staff.StaffDashboardResponse;
import com.groomish_now.backend.service.staff.StaffDashboardService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    @GetMapping("/analytics")
    public StaffAnalyticsResponse getBranchAnalytics(
            HttpServletRequest req,
            @RequestParam(value = "period", defaultValue = "WEEK") String period,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return staffDashboardService.getBranchAnalytics(getStaffId(req), period, startDate, endDate);
    }
}
