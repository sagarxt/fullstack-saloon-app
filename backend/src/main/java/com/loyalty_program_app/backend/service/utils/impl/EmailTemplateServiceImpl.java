package com.loyalty_program_app.backend.service.utils.impl;

import com.loyalty_program_app.backend.service.utils.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Year;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateServiceImpl implements EmailTemplateService {

    @Override
    public String buildTemplate(String subject, String content) {
        try {
            ClassPathResource resource = new ClassPathResource("templates/mail/email-template.html");
            try (InputStream is = resource.getInputStream()) {
                String html = StreamUtils.copyToString(is, StandardCharsets.UTF_8);
                html = html.replace("{{subject}}", subject != null ? subject : "Notification");
                html = html.replace("{{content}}", content != null ? content : "");
                html = html.replace("{{year}}", String.valueOf(Year.now().getValue()));
                return html;
            }
        } catch (Exception e) {
            log.error("Could not load email template from classpath: {}", e.getMessage());
            // Fallback to basic HTML container
            return "<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;'>"
                    + "<h2 style='color:#673AB7;'>" + subject + "</h2>"
                    + "<div>" + content + "</div>"
                    + "<p style='color:#888;font-size:12px;margin-top:20px;'>© " + Year.now().getValue() + " Loyalty App</p>"
                    + "</div>";
        }
    }
}
