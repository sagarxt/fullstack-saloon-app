package com.loyalty_program_app.backend.service.admin;

import com.loyalty_program_app.backend.dto.points.PointsLedgerRequest;
import com.loyalty_program_app.backend.dto.points.PointsLedgerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PointsLedgerAdminService {

    Page<PointsLedgerResponse> searchLedger(
            String userName,
            String reason,
            String fromDate,
            String toDate,
            Pageable pageable
    );

    PointsLedgerResponse manualAdjust(PointsLedgerRequest request);
}
