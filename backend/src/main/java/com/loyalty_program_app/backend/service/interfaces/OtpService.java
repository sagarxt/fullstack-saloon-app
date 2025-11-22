package com.loyalty_program_app.backend.service.interfaces;

public interface OtpService {
    String generateOtp(String email);
    boolean verifyOtp(String email, String otp);
}
