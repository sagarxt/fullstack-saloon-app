package com.loyalty_program_app.backend.model;

import com.loyalty_program_app.backend.enums.RedemptionStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "redemptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Redemption {
    @Id
    @GeneratedValue
    private UUID id;

    private UUID userId;
    private UUID rewardId;
    private Integer pointsUsed;
    @Enumerated(EnumType.STRING)
    private RedemptionStatus status;
    private Instant createdAt = Instant.now();
}
