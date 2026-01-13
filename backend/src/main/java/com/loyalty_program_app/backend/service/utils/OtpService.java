package com.loyalty_program_app.backend.service.utils;

public interface OtpService {
    Boolean generateOtp(String email);
    boolean verifyOtp(String email, String otp);
}
