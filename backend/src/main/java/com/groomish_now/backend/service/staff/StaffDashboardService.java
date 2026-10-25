package com.groomish_now.backend.service.staff;

import com.groomish_now.backend.dto.staff.StaffAnalyticsResponse;
import com.groomish_now.backend.dto.staff.StaffDashboardResponse;

import java.time.LocalDate;
import java.util.UUID;

public interface StaffDashboardService {

    StaffDashboardResponse getDashboard(UUID staffId);

    StaffAnalyticsResponse getBranchAnalytics(UUID staffId, String period, LocalDate startDate, LocalDate endDate);
}
