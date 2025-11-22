package com.loyalty_program_app.backend.dto.booking;

import lombok.Data;

@Data
public class BookingUpdateRequest {

    private String status;       // PENDING, CONFIRMED, COMPLETED, CANCELLED, MODIFIED, REFUNDED
    private String scheduledAt;  // ISO String: "2025-01-20T15:30:00"
    private String note;
    private Double totalAmount;
    private Double pricePaid;
}
