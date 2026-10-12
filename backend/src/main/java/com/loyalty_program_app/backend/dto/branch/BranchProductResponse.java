package com.loyalty_program_app.backend.dto.branch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchProductResponse {
    private UUID productId;
    private String name;
    private String description;
    private String brand;
    private String category;
    private Double price;
    private Double mrp;
    private String volumeOrSize;
    private String image;
    private List<String> images;
    private boolean globalActive;
    private boolean storeActive;
    private boolean effectiveActive; // globalActive && storeActive && stockQuantity > 0
    private Integer stockQuantity;
    private Integer lowStockThreshold;
    private boolean lowStock;
    private boolean outOfStock;
    private UUID storeId;
    private String storeName;
    private String updatedBy;
}
