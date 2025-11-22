package com.loyalty_program_app.backend.dto.notification;

import lombok.Data;
import java.util.UUID;

@Data
public class NotificationResponse {
    private UUID id;
    private UUID userId;
    private String title;
    private String message;
    private String type;
    private Boolean seen;
    private String createdAt;
}
