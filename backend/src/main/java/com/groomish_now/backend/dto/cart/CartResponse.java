package com.groomish_now.backend.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private String userEmail;

    private UUID storeId;
    private String storeName;
    private String storeAddress;

    @Builder.Default
    private List<CartItemResponse> items = new ArrayList<>();

    private int totalItemCount;
    private int servicesCount;
    private int productsCount;

    private Double servicesSubtotal;
    private Double productsSubtotal;
    private Double totalAmount;
    private Integer totalDurationMinutes;
    private Integer estimatedLoyaltyPoints;
}
