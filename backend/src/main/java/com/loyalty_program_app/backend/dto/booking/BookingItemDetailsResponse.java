package com.loyalty_program_app.backend.dto.booking;

import lombok.Data;

@Data
public class BookingItemDetailsResponse {

    private java.util.UUID id;
    private java.util.UUID serviceId;
    private String serviceName;
    private Double price;
    private Integer durationMinutes;
    private Integer rewardCoins;
    private String status;
}
