package com.groomish_now.backend.service.utils;

public interface GmailSenderService {

    /**
     * Sends an HTML email via Google Gmail REST API over HTTPS (Port 443).
     *
     * @param to recipient email address
     * @param subject email subject line
     * @param htmlContent HTML body content
     */
    void sendHtmlEmail(String to, String subject, String htmlContent);
}
