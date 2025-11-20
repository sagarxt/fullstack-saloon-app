package com.loyalty_program_app.backend.model;

import com.loyalty_program_app.backend.enums.PointsReason;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "points_ledger")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PointsLedger {
    @Id
    @GeneratedValue
    private UUID id;

    private UUID userId;
    private Integer changeAmount;
    @Enumerated(EnumType.STRING)
    private PointsReason reason;
    private UUID relatedId; // booking id / reward id
    private Instant createdAt = Instant.now();
}
