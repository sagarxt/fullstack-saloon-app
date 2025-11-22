package com.loyalty_program_app.backend.service.utils;

public interface EmailTemplateService {
    String buildTemplate(String subject, String content);
}
