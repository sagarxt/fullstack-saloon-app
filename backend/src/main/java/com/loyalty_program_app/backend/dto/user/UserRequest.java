package com.loyalty_program_app.backend.dto.user;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UserRequest {
    private String name;
    private String email;
    private String phone;
    private String gender;
    private LocalDate dob;
    private String image;
}
