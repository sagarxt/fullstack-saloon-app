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

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final EmailService emailService;

    // memory storage: email => [otp, expiry time]
    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    @Override
    public Boolean generateOtp(String email) {
        String subject = "Your OTP for Loyalty App";
        String otp = String.valueOf((int)(Math.random() * 900000 + 100000));
        otpStore.put(email, new OtpData(otp, LocalDateTime.now().plusMinutes(10)));

        Boolean otp_send = false;

        try {
            String html = Files.readString(
                    new ClassPathResource("templates/mail/send-otp.html").getFile().toPath(),
                    StandardCharsets.UTF_8
            );

            html = html.replace("{{otp}}", otp);

            emailService.sendHtmlEmail(email, subject, html);

            otp_send = true;

        } catch (Exception e) {
            throw new RuntimeException("Unable to send OTP ", e);
        } finally {
             return otp_send;
        }
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        if (!otpStore.containsKey(email)) return false;

        OtpData data = otpStore.get(email);

        if (data.expiry.isBefore(LocalDateTime.now())) {
            otpStore.remove(email);
            return false;
        }

        boolean valid = data.otp.equals(otp);

        if (valid) otpStore.remove(email);

        return valid;
    }

    private record OtpData(String otp, LocalDateTime expiry) {}
}
