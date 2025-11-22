package com.loyalty_program_app.backend.dto.staff;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class StaffCreateBookingRequest {
    private UUID customerId;
    private List<UUID> serviceIds;
    private String scheduledAt;   // ISO string
    private String note;
    private String couponCode;    // optional
}

