package com.groomish_now.backend.dto.cohort;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CohortRequest {
    private String name;
    private String code;
    private String description;
    private String color;
    private Boolean active;
    private Boolean autoApply;
    private String conditionOperator; // "AND" / "OR"

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
}
