package com.groomish_now.backend.service.utils.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.groomish_now.backend.service.utils.GmailSenderService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class GmailSenderServiceImpl implements GmailSenderService {

    private final ObjectMapper objectMapper;

    @Value("${gmail.api.client-id:}")
    private String clientId;

    @Value("${gmail.api.client-secret:}")
    private String clientSecret;

    @Value("${gmail.api.refresh-token:}")
    private String refreshToken;

    @Value("${gmail.api.sender-email:testmailemployee@gmail.com}")
    private String senderEmail;

    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private String cachedAccessToken;
    private long tokenExpiryEpochMs = 0L;

    @Override
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        if (!isConfigured()) {
            log.warn("Gmail API is not fully configured (client-id, client-secret, or refresh-token is missing). Skipping email dispatch to: {}", to);
            return;
        }

        try {
            sendWithRetry(to, subject, htmlContent, true);
        } catch (Exception e) {
            log.error("Failed to send email to {} via Gmail API: {}", to, e.getMessage(), e);
        }
    }

    private void sendWithRetry(String to, String subject, String htmlContent, boolean retryOnUnauthorized) throws Exception {
        String accessToken = getValidAccessToken();

        // 1. Build MimeMessage
        Properties props = new Properties();
        Session session = Session.getInstance(props, null);
        MimeMessage mimeMessage = new MimeMessage(session);
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());
        helper.setFrom(senderEmail, "Groomish Now");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        // 2. Encode to raw RFC 2822 Base64URL string (Gmail API requirement)
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        mimeMessage.writeTo(buffer);
        String rawBase64Url = Base64.getUrlEncoder().withoutPadding().encodeToString(buffer.toByteArray());

        String jsonPayload = objectMapper.writeValueAsString(Map.of("raw", rawBase64Url));

        // 3. Send over HTTPS Port 443
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GMAIL_SEND_URL))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 401 && retryOnUnauthorized) {
            log.warn("Gmail API returned 401 Unauthorized. Invalidating access token cache and retrying...");
            invalidateToken();
            sendWithRetry(to, subject, htmlContent, false);
            return;
        }

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("Groomish Now email successfully sent to: {} via Gmail API", to);
        } else {
            log.error("Gmail API send failed for {}. HTTP status: {}, Body: {}", to, response.statusCode(), response.body());
            throw new RuntimeException("Gmail API returned status " + response.statusCode() + ": " + response.body());
        }
    }

    private synchronized String getValidAccessToken() throws Exception {
        long now = System.currentTimeMillis();
        if (cachedAccessToken != null && now < tokenExpiryEpochMs) {
            return cachedAccessToken;
        }

        log.info("Requesting fresh Google OAuth2 access token for Gmail API...");
        String formBody = "client_id=" + URLEncoder.encode(clientId.trim(), StandardCharsets.UTF_8)
                + "&client_secret=" + URLEncoder.encode(clientSecret.trim(), StandardCharsets.UTF_8)
                + "&refresh_token=" + URLEncoder.encode(refreshToken.trim(), StandardCharsets.UTF_8)
                + "&grant_type=refresh_token";

        HttpRequest tokenRequest = HttpRequest.newBuilder()
                .uri(URI.create(GOOGLE_TOKEN_URL))
                .timeout(Duration.ofSeconds(15))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(formBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(tokenRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to refresh Gmail API token. HTTP " + response.statusCode() + ": " + response.body());
        }

        JsonNode jsonNode = objectMapper.readTree(response.body());
        JsonNode accessTokenNode = jsonNode.path("access_token");
        if (accessTokenNode.isMissingNode() || accessTokenNode.asText().isBlank()) {
            throw new RuntimeException("Response did not contain access_token: " + response.body());
        }

        this.cachedAccessToken = accessTokenNode.asText();
        long expiresIn = jsonNode.path("expires_in").asLong(3600);
        // Refresh 2 minutes before actual expiry
        this.tokenExpiryEpochMs = now + Math.max(60, expiresIn - 120) * 1000L;

        log.info("Successfully refreshed Gmail API access token (valid for {}s)", expiresIn);
        return this.cachedAccessToken;
    }

    private synchronized void invalidateToken() {
        this.cachedAccessToken = null;
        this.tokenExpiryEpochMs = 0L;
    }

    private boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
                && clientSecret != null && !clientSecret.isBlank()
                && refreshToken != null && !refreshToken.isBlank();
    }
}
