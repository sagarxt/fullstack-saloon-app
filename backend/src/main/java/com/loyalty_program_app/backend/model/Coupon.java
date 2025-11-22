package com.loyalty_program_app.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "coupons")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true)
    private String code;

    private String description;
    private Double minAmount;
    private Double maxDiscount;
    private Double discount;
    private LocalDateTime expiryDate;

    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
