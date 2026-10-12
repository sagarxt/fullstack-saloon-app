package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.StoreServiceAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreServiceAvailabilityRepository extends JpaRepository<StoreServiceAvailability, UUID> {
    List<StoreServiceAvailability> findByStoreId(UUID storeId);
    Optional<StoreServiceAvailability> findByStoreIdAndServiceId(UUID storeId, UUID serviceId);
    boolean existsByStoreIdAndServiceId(UUID storeId, UUID serviceId);
}
