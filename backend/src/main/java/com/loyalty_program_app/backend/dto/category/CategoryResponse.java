package com.loyalty_program_app.backend.dto.category;

import lombok.Data;
import java.util.UUID;

@Data
public class CategoryResponse {
    private UUID id;
    private String name;
    private String description;
    private String image;
    private Boolean active;
}
