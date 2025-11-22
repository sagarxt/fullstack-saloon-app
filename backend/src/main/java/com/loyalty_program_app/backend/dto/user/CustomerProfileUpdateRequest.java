package com.loyalty_program_app.backend.dto.user;

import lombok.Data;

@Data
public class CustomerProfileUpdateRequest {
    private String name;
    private String phone;
    private String gender;  // MALE/FEMALE/NOT_SPECIFIED
    private String image;   // Cloudinary URL
}
