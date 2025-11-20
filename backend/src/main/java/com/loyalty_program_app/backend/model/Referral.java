package com.loyalty_program_app.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "referrals")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Referral {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID userId;

    private String refereeEmail;

    private boolean awarded;
}
