package com.loyalty_program_app.backend.dto.booking;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BookingDetailsResponse {

    private UUID id;

    private String status;
    private String scheduledAt;
    private String bookedAt;
    private String bookedBy;

    private Double totalAmount;
    private Double pricePaid;

    private String couponApplied;

    private List<BookingItemDetailsResponse> items;
}
