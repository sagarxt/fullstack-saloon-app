package com.loyalty_program_app.backend.service.interfaces;

public interface EmailTemplateService {
    String buildTemplate(String subject, String content);
}
