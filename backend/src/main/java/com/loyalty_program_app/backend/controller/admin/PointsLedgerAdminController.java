package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.points.PointsLedgerRequest;
import com.loyalty_program_app.backend.dto.points.PointsLedgerResponse;
import com.loyalty_program_app.backend.service.admin.PointsLedgerAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/points-ledger")
@RequiredArgsConstructor
public class PointsLedgerAdminController {

    private final PointsLedgerAdminService ledgerService;

    @GetMapping
    public Page<PointsLedgerResponse> searchLedger(
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ledgerService.searchLedger(userName, reason, fromDate, toDate, pageable);
    }

    @PostMapping("/adjust")
    public PointsLedgerResponse manualAdjust(@RequestBody PointsLedgerRequest request) {
        return ledgerService.manualAdjust(request);
    }
}
