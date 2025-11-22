package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.service.interfaces.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.Year;

@Service
@RequiredArgsConstructor
public class EmailTemplateServiceImpl implements EmailTemplateService {

    @Override
    public String buildTemplate(String subject, String content) {
        try {
            String html = Files.readString(
                    new ClassPathResource("templates/email-template.html").getFile().toPath(),
                    StandardCharsets.UTF_8
            );

            html = html.replace("{{subject}}", subject);
            html = html.replace("{{content}}", content);
            html = html.replace("{{year}}", String.valueOf(Year.now().getValue()));

            return html;

        } catch (Exception e) {
            throw new RuntimeException("Could not load email template", e);
        }
    }
}
