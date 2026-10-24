package com.loyalty_program_app.backend.dto.productcategory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCategoryRequest {
    private String name;
    private String description;
    private Boolean active;
}
