package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.service.interfaces.EmailService;
import com.loyalty_program_app.backend.service.interfaces.EmailTemplateService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final EmailTemplateService templateService;

    @Override
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // HTML mode
            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Error sending email", e);
        }
    }

    @Override
    public void sendOtpEmail(String to, String otp) {
        String content = """
                <h3>Your OTP Code</h3>
                <p>Your verification OTP is:</p>
                <h2 style="color:#673AB7;">%s</h2>
                <p>This OTP is valid for 10 minutes.</p>
                """.formatted(otp);

        String html = templateService.buildTemplate("Your OTP Code", content);

        sendHtmlEmail(to, "Your OTP Code", html);
    }
}
