package com.loyalty_program_app.backend.service.staff;

import com.loyalty_program_app.backend.dto.staff.StaffDashboardResponse;

import java.util.UUID;

public interface StaffDashboardService {

    StaffDashboardResponse getDashboard(UUID staffId);
}
