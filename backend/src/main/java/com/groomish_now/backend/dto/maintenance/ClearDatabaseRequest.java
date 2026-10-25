package com.groomish_now.backend.dto.maintenance;

import lombok.Data;

@Data
public class ClearDatabaseRequest {
    private Boolean all;
    private Boolean categories;
    private Boolean services;
    private Boolean products;
    private Boolean brands;
    private Boolean bookings;
    private Boolean customers;
    private Boolean staff;
    private Boolean coupons;
    private Boolean notifications;
    private Boolean rewardPoints;
    private Boolean stores;
}
