package com.groomish_now.backend.service.customer;

import com.groomish_now.backend.dto.points.PointsBalanceResponse;
import com.groomish_now.backend.dto.points.PointsLedgerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerPointsService {

    PointsBalanceResponse getBalance(UUID userId);

    Page<PointsLedgerResponse> getHistory(UUID userId, Pageable pageable);
}
