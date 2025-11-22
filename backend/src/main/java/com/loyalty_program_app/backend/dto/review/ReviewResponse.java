package com.loyalty_program_app.backend.dto.review;

import lombok.Data;
import java.util.UUID;

@Data
public class ReviewResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private UUID serviceId;
    private Integer rating;
    private String review;
}
