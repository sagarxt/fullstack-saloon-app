package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.ServiceReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ServiceReviewRepository extends JpaRepository<ServiceReview, UUID> {

    Page<ServiceReview> findByServiceIdOrderByCreatedAtDesc(UUID serviceId, Pageable pageable);

    Page<ServiceReview> findByProductIdOrderByCreatedAtDesc(UUID productId, Pageable pageable);
 
    Page<ServiceReview> findByStoreIdOrderByCreatedAtDesc(UUID storeId, Pageable pageable);

    Page<ServiceReview> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    java.util.List<ServiceReview> findByBookingId(UUID bookingId);

    java.util.List<ServiceReview> findByUserIdAndBookingId(UUID userId, UUID bookingId);

    java.util.Optional<ServiceReview> findFirstByUserIdAndBookingIdAndServiceId(UUID userId, UUID bookingId, UUID serviceId);

    java.util.Optional<ServiceReview> findFirstByUserIdAndBookingIdAndProductId(UUID userId, UUID bookingId, UUID productId);

    java.util.Optional<ServiceReview> findFirstByUserIdAndBookingIdAndStoreId(UUID userId, UUID bookingId, UUID storeId);

    java.util.Optional<ServiceReview> findFirstByUserIdAndServiceId(UUID userId, UUID serviceId);

    java.util.Optional<ServiceReview> findFirstByUserIdAndProductId(UUID userId, UUID productId);

    java.util.Optional<ServiceReview> findFirstByUserIdAndStoreId(UUID userId, UUID storeId);

    @Query("SELECT AVG(r.rating) FROM ServiceReview r WHERE r.service.id = :serviceId")
    Double getAverageRatingByServiceId(@Param("serviceId") UUID serviceId);

    @Query("SELECT COUNT(r) FROM ServiceReview r WHERE r.service.id = :serviceId")
    Long countByServiceId(@Param("serviceId") UUID serviceId);

    @Query("SELECT AVG(r.rating) FROM ServiceReview r WHERE r.product.id = :productId")
    Double getAverageRatingByProductId(@Param("productId") UUID productId);

    @Query("SELECT COUNT(r) FROM ServiceReview r WHERE r.product.id = :productId")
    Long countByProductId(@Param("productId") UUID productId);

    @Query("SELECT AVG(r.rating) FROM ServiceReview r WHERE r.store.id = :storeId")
    Double getAverageRatingByStoreId(@Param("storeId") UUID storeId);

    @Query("SELECT COUNT(r) FROM ServiceReview r WHERE r.store.id = :storeId")
    Long countByStoreId(@Param("storeId") UUID storeId);
}
