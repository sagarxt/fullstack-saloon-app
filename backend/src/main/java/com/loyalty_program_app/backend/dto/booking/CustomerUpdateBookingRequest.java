package com.loyalty_program_app.backend.dto.booking;

import lombok.Data;

@Data
public class CustomerUpdateBookingRequest {
    private String scheduledAt;   // new date/time
    private String note;
}
