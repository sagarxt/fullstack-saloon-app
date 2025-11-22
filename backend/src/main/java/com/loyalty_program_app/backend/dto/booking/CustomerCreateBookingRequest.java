package com.loyalty_program_app.backend.dto.booking;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CustomerCreateBookingRequest {

    private List<UUID> serviceIds;   // list of service IDs to book
    private String scheduledAt;      // ISO: 2025-01-20T15:30:00
    private String note;
    private String couponCode;       // optional
}
