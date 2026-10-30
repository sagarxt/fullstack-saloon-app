package com.groomish_now.backend.dto.cohort;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CohortResponse {
    private UUID id;
    private String name;
    private String code;
    private String description;
    private String color;
    private boolean active;
    private boolean autoApply;
    private boolean isDefault;
    private String conditionOperator;

    // Rule Criteria
    private Set<String> eligibleTiers;
    private Integer minDaysSinceRegistration;
    private Integer maxDaysSinceRegistration;
    private Integer minLifetimePoints;
    private Integer maxLifetimePoints;
    private Integer minCurrentPoints;
    private Integer maxCurrentPoints;
    private Double minTotalSpend;
    private Double maxTotalSpend;
    private Integer minBookingsCount;
    private Integer maxBookingsCount;
    private Integer minDaysSinceLastVisit;
    private Integer maxDaysSinceLastVisit;
    private String gender;

    // Computed / Analytical Metadata
    private int matchingUsersCount;
    private String ruleSummary;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
