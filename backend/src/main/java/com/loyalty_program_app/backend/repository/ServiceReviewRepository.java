package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.ServiceReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ServiceReviewRepository extends JpaRepository<ServiceReview, UUID> {

    Page<ServiceReview> findByServiceIdOrderByCreatedAtDesc(UUID serviceId, Pageable pageable);

    Page<ServiceReview> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM ServiceReview r WHERE r.service.id = :serviceId")
    Double getAverageRatingByServiceId(@Param("serviceId") UUID serviceId);

    @Query("SELECT COUNT(r) FROM ServiceReview r WHERE r.service.id = :serviceId")
    Long countByServiceId(@Param("serviceId") UUID serviceId);
}
