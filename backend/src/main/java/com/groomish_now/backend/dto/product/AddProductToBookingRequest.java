package com.groomish_now.backend.dto.product;

import lombok.Data;
import java.util.UUID;

@Data
public class AddProductToBookingRequest {
    private UUID productId;
    private Integer quantity; // Defaults to 1 if null
}
