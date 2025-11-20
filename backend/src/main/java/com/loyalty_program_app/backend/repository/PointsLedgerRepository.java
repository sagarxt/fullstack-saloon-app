package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.PointsLedger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PointsLedgerRepository extends JpaRepository<PointsLedger, UUID> {
    List<PointsLedger> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<PointsLedger> findByUserId(UUID userId);
}

