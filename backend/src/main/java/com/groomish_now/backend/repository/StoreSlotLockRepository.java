package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.StoreSlotLock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreSlotLockRepository extends JpaRepository<StoreSlotLock, UUID> {

    Optional<StoreSlotLock> findByStoreIdAndSlotDate(UUID storeId, LocalDate slotDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM StoreSlotLock s WHERE s.storeId = :storeId AND s.slotDate = :slotDate")
    Optional<StoreSlotLock> findByStoreIdAndSlotDateForUpdate(
            @Param("storeId") UUID storeId,
            @Param("slotDate") LocalDate slotDate
    );

    @Modifying
    @Query(value = """
        INSERT INTO store_slot_locks (id, store_id, slot_date, total_bookings_today, updated_at)
        VALUES (gen_random_uuid(), :storeId, :slotDate, 0, NOW())
        ON CONFLICT (store_id, slot_date) DO NOTHING
    """, nativeQuery = true)
    int upsertLockRowNative(
            @Param("storeId") UUID storeId,
            @Param("slotDate") LocalDate slotDate
    );
}
