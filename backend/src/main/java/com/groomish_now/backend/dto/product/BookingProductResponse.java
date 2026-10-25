package com.groomish_now.backend.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingProductResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private String brand;
    private String volumeOrSize;
    private String image;
    private Double unitPrice;
    private Double mrp;
    private Integer quantity;
    private Double totalPrice;
}
