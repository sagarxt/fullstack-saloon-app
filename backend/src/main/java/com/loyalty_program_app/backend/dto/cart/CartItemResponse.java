package com.loyalty_program_app.backend.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {
    private UUID id;
    private String itemType; // "SERVICE" or "PRODUCT"

    // Service specifics
    private UUID serviceId;
    private String serviceName;
    private Double servicePrice;
    private Integer serviceDurationMinutes;
    private String serviceGender;
    private String serviceCategoryName;
    private String serviceImage;

    // Product specifics
    private UUID productId;
    private String productName;
    private String productBrand;
    private Double productPrice;
    private Double productMrp;
    private String productImage;
    private String productVolume;
    private String productCategory;

    // Common
    private Integer quantity;
    private Double unitPrice;
    private Double totalPrice;
    private String customNotes;
}
