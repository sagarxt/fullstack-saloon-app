package com.loyalty_program_app.backend.model;

import com.loyalty_program_app.backend.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;

    @Column(unique = true)
    private String email;

    private String phone;

    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    private Integer points;

    private boolean active = true;

    @Column(unique = true)
    private String referralCode;

    private String referredBy;

    private Instant createdAt = Instant.now();
}
