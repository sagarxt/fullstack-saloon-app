package com.groomish_now.backend.dto.category;

import lombok.Data;

@Data
public class CategoryRequest {
    private String name;
    private String description;
    private String image;
    private Boolean active;
}
