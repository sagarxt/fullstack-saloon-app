package com.groomish_now.backend.dto.productcategory;

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
public class ProductCategoryResponse {
    private UUID id;
    private String name;
    private String description;
    private boolean active;
    private long productCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
