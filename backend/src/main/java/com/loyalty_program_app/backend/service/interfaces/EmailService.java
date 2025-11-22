package com.loyalty_program_app.backend.service.interfaces;

public interface EmailService {
    void sendHtmlEmail(String to, String subject, String htmlContent);
    void sendOtpEmail(String to, String otp);
}
