package com.groomish_now.backend.service.utils.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.groomish_now.backend.service.utils.GmailSenderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GmailSenderServiceImpl implements GmailSenderService {

    private final ObjectMapper objectMapper;

    @Value("${GMAIL_CLIENT_ID:${gmail.api.client-id:${gmail.client-id:}}}")
    private String clientId;

    @Value("${GMAIL_CLIENT_SECRET:${gmail.api.client-secret:${gmail.client-secret:}}}")
    private String clientSecret;

    @Value("${GMAIL_REFRESH_TOKEN:${gmail.api.refresh-token:${gmail.refresh-token:}}}")
    private String refreshToken;

    @Value("${GMAIL_SENDER_EMAIL:${gmail.api.sender-email:${gmail.sender-email:testmailemployee@gmail.com}}}")
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

        // Build RFC 2822 MIME message directly (Standard RFC-compliant for text/html)
        String encodedSubject = "=?UTF-8?B?" + Base64.getEncoder().encodeToString(subject.getBytes(StandardCharsets.UTF_8)) + "?=";
        String rawEmail = "From: Groomish Now <" + senderEmail + ">\r\n"
                + "To: " + to + "\r\n"
                + "Subject: " + encodedSubject + "\r\n"
                + "MIME-Version: 1.0\r\n"
                + "Content-Type: text/html; charset=UTF-8\r\n\r\n"
                + htmlContent;

        // Encode to raw RFC 2822 Base64URL string (Gmail API requirement)
        String rawBase64Url = Base64.getUrlEncoder().withoutPadding().encodeToString(rawEmail.getBytes(StandardCharsets.UTF_8));
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
        boolean hasClientId = clientId != null && !clientId.trim().isBlank();
        boolean hasClientSecret = clientSecret != null && !clientSecret.trim().isBlank();
        boolean hasRefreshToken = refreshToken != null && !refreshToken.trim().isBlank();

        if (!hasClientId || !hasClientSecret || !hasRefreshToken) {
            log.warn("Gmail API configuration check failed: GMAIL_CLIENT_ID present={}, GMAIL_CLIENT_SECRET present={}, GMAIL_REFRESH_TOKEN present={}",
                    hasClientId, hasClientSecret, hasRefreshToken);
            return false;
        }
        return true;
    }
}
