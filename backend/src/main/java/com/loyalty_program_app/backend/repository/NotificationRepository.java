package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserIdAndSeenFalse(UUID userId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.seen = true WHERE n.user.id = :userId")
    void markAllSeenByUserId(@Param("userId") UUID userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
