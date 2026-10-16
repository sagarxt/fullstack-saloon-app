package com.loyalty_program_app.backend.dto.branch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchServiceResponse {
    private UUID serviceId;
    private String name;
    private String categoryName;
    private UUID categoryId;
    private String gender;
    private Double mrp;
    private Double price;
    private Integer durationMinutes;
    private String image;
    private String description;
    private Integer rewards;
    private boolean globalActive;
    private boolean storeActive; // whether enabled for this specific store
    private boolean effectiveActive; // globalActive && storeActive
    private UUID storeId;
    private String storeName;
    private String updatedBy;
    private java.util.List<com.loyalty_program_app.backend.dto.service.SubServiceDto> subServices;

    public UUID getId() {
        return serviceId;
    }

    public void setId(UUID id) {
        this.serviceId = id;
    }
}
