package com.groomish_now.backend.model;

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

    private UUID productId;
    private String productName;

    @Builder.Default
    private String targetType = "ALL"; // "ALL", "SERVICE", "PRODUCT", "CATEGORY", "BRAND", "CUSTOM"

    @Builder.Default
    private String conditionOperator = "OR"; // "OR" or "AND"

    private Integer discountPercent;
    private Double discountAmount;
    private Integer validityDays;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "reward_eligible_categories", joinColumns = @JoinColumn(name = "reward_id"))
    @Column(name = "category_name")
    @Builder.Default
    private java.util.List<String> eligibleCategories = new java.util.ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "reward_eligible_brands", joinColumns = @JoinColumn(name = "reward_id"))
    @Column(name = "brand_name")
    @Builder.Default
    private java.util.List<String> eligibleBrands = new java.util.ArrayList<>();

    private LocalDateTime expiryDate;

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

