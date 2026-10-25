package com.groomish_now.backend.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BookingPreviewResponse {

    private double totalAmount;
    private double discount;
    private double finalPrice;
    private int rewardsEarned;
}
