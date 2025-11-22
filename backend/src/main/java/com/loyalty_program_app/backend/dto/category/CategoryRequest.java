package com.loyalty_program_app.backend.dto.category;

import lombok.Data;

@Data
public class CategoryRequest {
    private String name;
    private String description;
    private String image;
}
