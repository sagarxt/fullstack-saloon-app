package com.groomish_now.backend.service.utils;

public interface EmailTemplateService {
    String buildTemplate(String subject, String content);
}
