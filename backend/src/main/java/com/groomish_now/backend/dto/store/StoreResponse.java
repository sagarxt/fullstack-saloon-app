package com.groomish_now.backend.dto.store;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class StoreResponse {
    private UUID id;
    private String name;
    private String code;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String phone;
    private String email;
    private String logo;
    private String image;
    private java.util.List<String> images;
    private Double latitude;
    private Double longitude;
    private boolean active;
    private String openingTime;
    private String closingTime;
    private Double distanceKm; // Computed dynamically relative to user coordinates
    private LocalDateTime createdAt;
}
