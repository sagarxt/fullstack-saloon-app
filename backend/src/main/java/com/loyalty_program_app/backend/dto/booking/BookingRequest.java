package com.loyalty_program_app.backend.dto.booking;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class BookingRequest {
    private UUID userId;
    private UUID couponId;
    private String scheduledAt;
    private String note;
    private List<UUID> serviceIds; // List of service IDs chosen
}
