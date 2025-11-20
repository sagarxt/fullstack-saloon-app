package com.loyalty_program_app.backend.dto.booking;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class BookingRequest {

    private UUID userId;
    private UUID serviceId;

    private OffsetDateTime scheduledAt;

    private Double pricePaid;

    private String note;

    private String paymentGatewayId;
}
