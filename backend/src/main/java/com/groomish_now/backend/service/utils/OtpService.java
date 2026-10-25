package com.groomish_now.backend.service.utils;

public interface OtpService {
    Boolean generateOtp(String email);
    boolean verifyOtp(String email, String otp);
}
