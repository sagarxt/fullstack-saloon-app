package com.loyalty_program_app.backend.service.interfaces;

import com.loyalty_program_app.backend.dto.points.PointsBalanceResponse;
import com.loyalty_program_app.backend.dto.points.PointsLedgerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerPointsService {

    PointsBalanceResponse getBalance(UUID userId);

    Page<PointsLedgerResponse> getHistory(UUID userId, Pageable pageable);
}
