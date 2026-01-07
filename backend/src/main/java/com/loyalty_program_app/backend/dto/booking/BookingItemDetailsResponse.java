package com.loyalty_program_app.backend.dto.booking;

import lombok.Data;

@Data
public class BookingItemDetailsResponse {

    private String serviceName;
    private Double price;
    private Integer durationMinutes;
}
