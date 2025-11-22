package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.PointsLedger;
import com.loyalty_program_app.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface PointsLedgerRepository extends JpaRepository<PointsLedger, UUID> {
    List<PointsLedger> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<PointsLedger> findByUserId(UUID userId);

    List<PointsLedger> findByReason(String reason);

    List<PointsLedger> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<PointsLedger> findByUser(User user);

    Page<PointsLedger> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

}

