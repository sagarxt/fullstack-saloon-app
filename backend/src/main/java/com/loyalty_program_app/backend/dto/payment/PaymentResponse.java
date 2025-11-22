package com.loyalty_program_app.backend.dto.payment;

import lombok.Data;
import java.util.UUID;

@Data
public class PaymentResponse {
    private UUID id;
    private String invoiceNumber;

    private UUID userId;
    private String userName;
    private String userEmail;

    private Double amount;
    private String paymentMethod;
    private String paymentModeDetails;
    private String status;
    private String paymentGatewayId;

    private String createdAt;
}
