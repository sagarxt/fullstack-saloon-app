package com.loyalty_program_app.backend.model;

import com.loyalty_program_app.backend.enums.Gender;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.enums.Tier;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class User {

    @Id
    @GeneratedValue
    private UUID id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;
    private String phone;
    private String image;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private LocalDateTime dob;

    @Enumerated(EnumType.STRING)
    private Role role;

    private Integer points = 0;

    @Enumerated(EnumType.STRING)
    private Tier tier = Tier.SILVER;

    @Column(unique = true)
    private String referralCode;

    private UUID createdBy;
    private UUID updatedBy;

    private boolean active = true;

    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
