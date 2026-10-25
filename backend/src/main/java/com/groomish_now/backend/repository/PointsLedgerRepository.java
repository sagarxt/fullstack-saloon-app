package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.PointsLedger;
import com.groomish_now.backend.model.User;
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

    boolean existsByRelatedId(UUID relatedId);

    List<PointsLedger> findByRelatedId(UUID relatedId);

    List<PointsLedger> findByRelatedIdIn(java.util.Collection<UUID> relatedIds);

    java.util.Optional<PointsLedger> findFirstByRelatedId(UUID relatedId);
}

