package com.groomish_now.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "cohorts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Cohort {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(length = 1000)
    private String description;

    @Builder.Default
    private String color = "groomish-orange";

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private boolean autoApply = true;

    @Builder.Default
    private boolean isDefault = false;

    // Condition matching operator: "AND" (all criteria must match) or "OR" (any criteria matches)
    @Builder.Default
    @Column(name = "condition_operator")
    private String conditionOperator = "AND";

    // -------------------------------------------------------------------------
    // RULE CRITERIA LOGIC
    // -------------------------------------------------------------------------

    // 1. Eligible Loyalty Tiers (e.g. SILVER, GOLD, PLATINUM, DIAMOND)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "cohort_eligible_tiers", joinColumns = @JoinColumn(name = "cohort_id"))
    @Column(name = "tier_name")
    @Builder.Default
    private Set<String> eligibleTiers = new HashSet<>();

    // 2. Account Age (Days since user registration)
    private Integer minDaysSinceRegistration;
    private Integer maxDaysSinceRegistration;

    // 3. Points metrics
    private Integer minLifetimePoints;
    private Integer maxLifetimePoints;
    private Integer minCurrentPoints;
    private Integer maxCurrentPoints;

    // 4. Booking & Spend metrics
    private Double minTotalSpend;
    private Double maxTotalSpend;
    private Integer minBookingsCount;
    private Integer maxBookingsCount;

    // 5. Inactivity / Churn metrics (Days since customer's last appointment)
    private Integer minDaysSinceLastVisit;
    private Integer maxDaysSinceLastVisit;

    // 6. Demographic
    private String gender; // "ALL", "MALE", "FEMALE", etc.

    // -------------------------------------------------------------------------
    // TIMESTAMPS
    // -------------------------------------------------------------------------
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
