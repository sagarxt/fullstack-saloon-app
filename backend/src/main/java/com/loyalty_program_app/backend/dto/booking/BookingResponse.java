package com.loyalty_program_app.backend.dto.booking;

import com.loyalty_program_app.backend.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private UUID id;
    private UUID userId;
    private UUID serviceId;

    private OffsetDateTime scheduledAt;
    private Double pricePaid;

    private BookingStatus status;

    private String note;
    private String paymentGatewayId;

    private Instant createdAt;
}
