package com.groomish_now.backend.service.notification.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.groomish_now.backend.service.notification.ExpoPushNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class ExpoPushNotificationServiceImpl implements ExpoPushNotificationService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ExpoPushNotificationServiceImpl() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    @Async
    public void sendPushNotification(String expoPushToken, String title, String body, Map<String, Object> data) {
        if (expoPushToken == null || expoPushToken.isBlank()) {
            log.debug("Skipping Expo push notification: No push token provided.");
            return;
        }

        // Validate Expo token format
        String trimmedToken = expoPushToken.trim();
        if (!trimmedToken.startsWith("ExponentPushToken[") && !trimmedToken.startsWith("ExpoPushToken[")) {
            log.warn("Invalid Expo push token format: {}. Expected ExponentPushToken[...] or ExpoPushToken[...]", trimmedToken);
            return;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("to", trimmedToken);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("sound", "default");
            payload.put("priority", "high");
            if (data != null && !data.isEmpty()) {
                payload.put("data", data);
            }

            String jsonPayload = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(EXPO_PUSH_URL))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("Accept-Encoding", "gzip, deflate")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Expo push notification sent successfully to token prefix {} (Status {})",
                        trimmedToken.substring(0, Math.min(25, trimmedToken.length())), response.statusCode());
            } else {
                log.warn("Expo push notification returned HTTP {}: {}", response.statusCode(), response.body());
            }

        } catch (Exception e) {
            log.error("Failed to send Expo push notification to {}: {}", trimmedToken, e.getMessage(), e);
        }
    }
}
