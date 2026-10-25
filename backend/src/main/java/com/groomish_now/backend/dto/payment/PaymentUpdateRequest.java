package com.groomish_now.backend.dto.payment;

import lombok.Data;

@Data
public class PaymentUpdateRequest {
    private String status;               // PENDING / COMPLETED / FAILED
    private String paymentModeDetails;   // Optional update
}
