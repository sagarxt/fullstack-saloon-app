package com.loyalty_program_app.backend.dto.brand;

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
public class BrandResponse {
    private UUID id;
    private String name;
    private String logo;
    private String shortDescription;
    private Boolean active;
    private Long productCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
