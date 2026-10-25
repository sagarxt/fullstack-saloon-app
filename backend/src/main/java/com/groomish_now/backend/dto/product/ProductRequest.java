package com.groomish_now.backend.dto.product;

import lombok.Data;

@Data
public class ProductRequest {
    private String name;
    private String description;
    private String brand;
    private String category;
    private Double price;
    private Double mrp;
    private String volumeOrSize;
    private Integer stockQuantity;
    private String image;
    private java.util.List<String> images;
    private Boolean inStorePickupOnly;
    private Boolean active;
}
