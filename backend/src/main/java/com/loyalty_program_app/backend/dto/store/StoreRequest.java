package com.loyalty_program_app.backend.dto.store;

import lombok.Data;

@Data
public class StoreRequest {
    private String name;
    private String code;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String phone;
    private String email;
    private String image;
    private java.util.List<String> images;
    private Double latitude;
    private Double longitude;
    private Boolean active;
    private String openingTime;
    private String closingTime;
}
