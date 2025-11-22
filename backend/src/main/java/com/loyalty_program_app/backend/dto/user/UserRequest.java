package com.loyalty_program_app.backend.dto.user;

import lombok.Data;

@Data
public class UserRequest {
    private String name;
    private String email;
    private String phone;
    private String gender;
    private String dob;
    private String image;
}
