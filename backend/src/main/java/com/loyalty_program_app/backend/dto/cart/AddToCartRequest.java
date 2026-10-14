package com.loyalty_program_app.backend.dto.cart;

import com.loyalty_program_app.backend.enums.CartItemType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartRequest {
    private CartItemType itemType; // SERVICE or PRODUCT
    private UUID serviceId;
    private UUID productId;
    @Builder.Default
    private Integer quantity = 1;
    private String customNotes;
    private UUID storeId;
}
