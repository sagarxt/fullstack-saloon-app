package com.loyalty_program_app.backend.dto.user;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String name;
    private String email;
    private String phone;
    private String password; // optional, hashed only if provided
    private String gender;
}
