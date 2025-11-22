package com.loyalty_program_app.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "referrals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Referral {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "referrer_id")
    private User referrer;

    @ManyToOne
    @JoinColumn(name = "referred_id")
    private User referred;

    private boolean rewardGiven = false;

    @OneToOne
    @JoinColumn(name = "points_ledger_id")
    private PointsLedger pointsLedger;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
