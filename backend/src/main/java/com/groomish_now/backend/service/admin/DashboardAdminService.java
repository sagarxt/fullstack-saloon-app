package com.groomish_now.backend.service.admin;

import com.groomish_now.backend.dto.dashboard.DashboardResponse;

public interface DashboardAdminService {
    default DashboardResponse getDashboardData() {
        return getDashboardData("30D", null, null);
    }

    DashboardResponse getDashboardData(String period, String startDate, String endDate);
}
