package com.loyalty_program_app.backend.dto.review;

import lombok.Data;
import java.util.UUID;

@Data
public class ReviewRequest {
    private UUID userId;
    private UUID serviceId;
    private Integer rating;
    private String review;
}
