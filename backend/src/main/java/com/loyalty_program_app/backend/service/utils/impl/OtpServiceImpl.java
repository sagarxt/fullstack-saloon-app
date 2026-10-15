package com.loyalty_program_app.backend.service.utils.impl;

import com.loyalty_program_app.backend.service.utils.EmailService;
import com.loyalty_program_app.backend.service.utils.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final EmailService emailService;

    @Value("${app.branding.logo-url:https://res.cloudinary.com/dfdnljcyt/image/upload/groomish-logo-black-bg_et3gzt.png}")
    private String logoUrl;

    // memory storage: email => [otp, expiry time]
    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    @Override
    public Boolean generateOtp(String email) {
        if (email == null || email.trim().isBlank()) {
            return false;
        }
        String cleanEmail = email.trim().toLowerCase();
        String subject = "Your OTP for Groomish Now";
        String otp = String.valueOf((int)(Math.random() * 900000 + 100000));
        otpStore.put(cleanEmail, new OtpData(otp, LocalDateTime.now().plusMinutes(10)));

        Boolean otp_send = false;

        try {
            ClassPathResource resource = new ClassPathResource("templates/mail/send-otp.html");
            String html;
            try (java.io.InputStream is = resource.getInputStream()) {
                html = org.springframework.util.StreamUtils.copyToString(is, StandardCharsets.UTF_8);
            } catch (Exception ex) {
                html = "<div style='font-family:sans-serif;padding:20px;text-align:center;background:#FAF6ED;'>"
                        + "<div style='background:#111;padding:12px;border-radius:8px;display:inline-block;margin-bottom:15px;'>"
                        + "<img src='" + logoUrl + "' alt='Groomish Now' style='max-height:45px;' />"
                        + "</div>"
                        + "<h2>Your OTP Verification Code</h2>"
                        + "<h1 style='color:#FC6957;letter-spacing:5px;'>" + otp + "</h1>"
                        + "<p>This code is valid for 10 minutes.</p>"
                        + "</div>";
            }

            html = html.replace("{{logoUrl}}", logoUrl != null ? logoUrl : "https://res.cloudinary.com/dfdnljcyt/image/upload/groomish-logo-black-bg_et3gzt.png");
            html = html.replace("{{otp}}", otp);
            emailService.sendHtmlEmail(cleanEmail, subject, html);
            otp_send = true;
        } catch (Exception e) {
            System.err.println("Unable to send OTP: " + e.getMessage());
        }
        return otp_send;
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        if (email == null || otp == null || email.trim().isBlank()) return false;
        String cleanEmail = email.trim().toLowerCase();
        if (!otpStore.containsKey(cleanEmail)) return false;

        OtpData data = otpStore.get(cleanEmail);

        if (data.expiry.isBefore(LocalDateTime.now())) {
            otpStore.remove(cleanEmail);
            return false;
        }

        boolean valid = data.otp.equals(otp.trim());

        if (valid) otpStore.remove(cleanEmail);

        return valid;
    }

    private record OtpData(String otp, LocalDateTime expiry) {}
}
