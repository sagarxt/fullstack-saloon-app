package com.loyalty_program_app.backend.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRatingSummaryResponse {

    private UUID serviceId;
    private Double averageRating;
    private Long totalReviews;
}
