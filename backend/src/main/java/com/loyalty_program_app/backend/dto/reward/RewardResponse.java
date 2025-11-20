package com.loyalty_program_app.backend.dto.reward;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RewardResponse {
    private UUID id;
    private String title;
    private String description;
    private Integer pointsRequired;
    private Boolean active;
}
