package com.loyalty_program_app.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    private String brand;

    private String category; // "Hair Care", "Skin & Facial", "Beard Care", "Styling"

    @Column(nullable = false)
    private Double price;

    private Double mrp;

    private String volumeOrSize;

    @Builder.Default
    private Integer stockQuantity = 50;

    private String image;

    @Builder.Default
    private Boolean inStorePickupOnly = true;

    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
