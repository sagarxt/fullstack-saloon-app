package com.loyalty_program_app.backend.dto.product;

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
public class ProductResponse {
    private UUID id;
    private String name;
    private String description;
    private String brand;
    private String category;
    private Double price;
    private Double mrp;
    private String volumeOrSize;
    private Integer stockQuantity;
    private String image;
    private Boolean inStorePickupOnly;
    private Boolean active;
    private LocalDateTime createdAt;
}
