package com.loyalty_program_app.backend.dto.mail;

import lombok.Data;

@Data
public class VerifyOtpRequest {
    private String email;
    private String otp;
}
