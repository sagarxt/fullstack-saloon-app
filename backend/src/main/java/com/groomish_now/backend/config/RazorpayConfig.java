package com.groomish_now.backend.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
@Getter
public class RazorpayConfig {

    @Value("${razorpay.key-id:${razorpay.key.id:}}")
    private String keyId;

    @Value("${razorpay.key-secret:${razorpay.key.secret:}}")
    private String keySecret;

    @Bean
    public RazorpayClient razorpayClient() {
        if (keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank() && !keyId.contains("placeholder")) {
            try {
                log.info("✔ RazorpayClient initialized with keyId: {}", keyId.substring(0, Math.min(8, keyId.length())) + "...");
                return new RazorpayClient(keyId.trim(), keySecret.trim());
            } catch (RazorpayException e) {
                log.error("Failed to initialize RazorpayClient: {}", e.getMessage());
            }
        } else {
            log.warn("RazorpayClient key-id or key-secret not configured.");
        }
        return null;
    }
}
