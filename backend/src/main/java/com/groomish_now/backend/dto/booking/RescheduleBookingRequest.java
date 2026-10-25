package com.groomish_now.backend.dto.booking;

import lombok.Data;

@Data
public class RescheduleBookingRequest {

    private String scheduledAt;  // new datetime
    private String note;
}
