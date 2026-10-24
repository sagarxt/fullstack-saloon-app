package com.loyalty_program_app.backend.dto.brand;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandRequest {
    private String name;
    private String logo; // 1:1 brand logo image URL
    private String shortDescription;
    @Builder.Default
    private Boolean active = true;
}
