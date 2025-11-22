package com.loyalty_program_app.backend.dto.booking;

import lombok.Data;
import java.util.UUID;

@Data
public class BookingItemResponse {
    private UUID id;
    private UUID serviceId;
    private String serviceName;
    private Double servicePrice;
    private Integer duration;
    private String status;
}
