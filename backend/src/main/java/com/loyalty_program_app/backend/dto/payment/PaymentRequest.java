package com.loyalty_program_app.backend.dto.payment;

import lombok.Data;
import java.util.UUID;

@Data
public class PaymentRequest {
    private UUID userId;
    private Double amount;
    private String paymentMethod;
    private String paymentModeDetails;
}
