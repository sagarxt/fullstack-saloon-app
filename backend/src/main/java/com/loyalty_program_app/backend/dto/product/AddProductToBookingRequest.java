package com.loyalty_program_app.backend.dto.product;

import lombok.Data;
import java.util.UUID;

@Data
public class AddProductToBookingRequest {
    private UUID productId;
    private Integer quantity; // Defaults to 1 if null
}
