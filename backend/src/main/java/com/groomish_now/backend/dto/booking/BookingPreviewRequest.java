package com.groomish_now.backend.dto.booking;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BookingPreviewRequest {

    private List<UUID> serviceIds;
    private String couponCode;
}
