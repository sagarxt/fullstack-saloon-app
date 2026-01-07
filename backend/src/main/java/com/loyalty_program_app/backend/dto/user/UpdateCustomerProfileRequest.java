package com.loyalty_program_app.backend.dto.user;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateCustomerProfileRequest {

    private String name;
    private LocalDate dob;
    private String gender;
    private String phone;
}
