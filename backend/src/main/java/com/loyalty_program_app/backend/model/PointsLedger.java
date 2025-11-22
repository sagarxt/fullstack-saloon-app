package com.loyalty_program_app.backend.model;

import com.loyalty_program_app.backend.enums.PointReason;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "points_ledger")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointsLedger {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private Integer changeAmount;

    @Enumerated(EnumType.STRING)
    private PointReason reason;

    private UUID relatedId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
