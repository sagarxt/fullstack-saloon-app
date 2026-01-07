package com.loyalty_program_app.backend.dto.user;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CustomerProfileResponse {

    private UUID id;
    private String name;
    private LocalDate dob;
    private String gender;
    private String phone;
    private String email;
}
