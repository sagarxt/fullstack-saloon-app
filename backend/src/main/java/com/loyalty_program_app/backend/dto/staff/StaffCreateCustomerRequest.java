package com.loyalty_program_app.backend.dto.staff;

import lombok.Data;

@Data
public class StaffCreateCustomerRequest {
    private String name;
    private String email;
    private String phone;
    private String password;
    private String gender; // MALE/FEMALE/NOT_SPECIFIED
}
