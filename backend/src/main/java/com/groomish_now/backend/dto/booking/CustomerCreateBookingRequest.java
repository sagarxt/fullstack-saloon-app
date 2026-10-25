package com.groomish_now.backend.dto.booking;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CustomerCreateBookingRequest {

    private UUID serviceId;
    private java.util.List<UUID> serviceIds;
    private LocalDateTime scheduledAt;      // ISO: 2025-01-20T15:30:00
    private String note;
    private String couponCode;       // optional
    private UUID storeId;
    private String paymentMethod;    // CASH (Pay at Salon), UPI, CARD
}
