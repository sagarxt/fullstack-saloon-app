package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.StoreProductInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreProductInventoryRepository extends JpaRepository<StoreProductInventory, UUID> {
    List<StoreProductInventory> findByStoreId(UUID storeId);
    Optional<StoreProductInventory> findByStoreIdAndProductId(UUID storeId, UUID productId);
    boolean existsByStoreIdAndProductId(UUID storeId, UUID productId);
}
