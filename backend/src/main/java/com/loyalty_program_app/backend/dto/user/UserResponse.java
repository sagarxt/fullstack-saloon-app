package com.loyalty_program_app.backend.dto.user;

import lombok.Data;
import java.util.UUID;

@Data
public class UserResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String image;
    private String gender;
    private String role;
    private String tier;
    private Integer points;
    private String referralCode;
    private Boolean active;
}
