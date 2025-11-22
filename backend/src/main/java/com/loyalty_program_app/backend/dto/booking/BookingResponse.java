package com.loyalty_program_app.backend.dto.booking;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class BookingResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private UUID paymentId;
    private UUID couponId;
    private Double totalAmount;
    private Double pricePaid;
    private String status;
    private String scheduledAt;
    private String note;
    private String bookedBy;
    private List<BookingItemResponse> items;
}
