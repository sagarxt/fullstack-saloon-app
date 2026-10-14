package com.loyalty_program_app.backend.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceReviewResponse {

    private UUID id;
    private UUID serviceId;
    private String serviceName;
    private UUID productId;
    private String productName;
    private UUID bookingId;
    private UUID userId;
    private String userName;
    private String userImage;
    private Integer rating;
    private String review;
    private LocalDateTime createdAt;
}
