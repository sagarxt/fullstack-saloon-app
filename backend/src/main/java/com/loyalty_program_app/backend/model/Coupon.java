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
    private LocalDateTime startDate;
    private LocalDateTime expiryDate;

    @Builder.Default
    private boolean active = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "coupon_eligible_categories", joinColumns = @JoinColumn(name = "coupon_id"))
    @Column(name = "category_name")
    @Builder.Default
    private java.util.List<String> eligibleCategories = new java.util.ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "coupon_applicable_user_groups", joinColumns = @JoinColumn(name = "coupon_id"))
    @Column(name = "group_name")
    @Builder.Default
    private java.util.List<String> applicableUserGroups = new java.util.ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;
}
