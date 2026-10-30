package com.groomish_now.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "store_slot_locks", uniqueConstraints = {
        @UniqueConstraint(name = "uk_store_slot_date", columnNames = {"store_id", "slot_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreSlotLock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "total_bookings_today", nullable = false)
    @Builder.Default
    private Integer totalBookingsToday = 0;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
