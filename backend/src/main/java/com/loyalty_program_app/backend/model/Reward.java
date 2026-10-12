package com.loyalty_program_app.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rewards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reward {

    @Id
    @GeneratedValue
    private UUID id;

    private String title;
    private String image;
    private String description;

    private Integer pointsRequired;
    private Integer stock;

    private UUID serviceId;
    private String serviceName;
    private Integer discountPercent;
    private Integer validityDays;

    private LocalDateTime expiryDate;

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

