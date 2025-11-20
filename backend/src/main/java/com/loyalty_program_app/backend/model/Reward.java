package com.loyalty_program_app.backend.model;

import com.loyalty_program_app.backend.enums.RewardStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rewards")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reward {
    @Id
    @GeneratedValue
    private UUID id;

    private String title;
    @Column(length=1000)
    private String description;
    private Integer pointsRequired;
    private Boolean active = true;
    @Enumerated(EnumType.STRING)
    private RewardStatus status;
    private Instant createdAt = Instant.now();
}

