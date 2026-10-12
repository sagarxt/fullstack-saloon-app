package com.loyalty_program_app.backend.service.staff;

import com.loyalty_program_app.backend.dto.staff.StaffAnalyticsResponse;
import com.loyalty_program_app.backend.dto.staff.StaffDashboardResponse;

import java.time.LocalDate;
import java.util.UUID;

public interface StaffDashboardService {

    StaffDashboardResponse getDashboard(UUID staffId);

    StaffAnalyticsResponse getBranchAnalytics(UUID staffId, String period, LocalDate startDate, LocalDate endDate);
}
