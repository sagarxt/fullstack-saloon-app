package com.loyalty_program_app.backend.dto.admin;

import lombok.Data;

@Data
public class AdminRequest {
    private String name;
    private String email;
    private String phone;
    private String password;     // optional for update
    private String gender;       // MALE/FEMALE/NOT_SPECIFIED
}
