package com.loyalty_program_app.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "services")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceEntity {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable=false)
    private String name;

    @Column(length = 2000)
    private String description;

    private Double mrp;
    private Double price;
    private Integer durationMinutes;

    private Instant createdAt = Instant.now();
}
