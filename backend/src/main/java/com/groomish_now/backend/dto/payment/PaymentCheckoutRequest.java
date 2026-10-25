package com.groomish_now.backend.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCheckoutRequest {

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // CASH, UPI, CARD, VOUCHER

    private String paymentModeDetails;

    private String paymentGatewayId;
}
