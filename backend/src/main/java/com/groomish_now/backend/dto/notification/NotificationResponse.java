package com.groomish_now.backend.dto.notification;

import lombok.Data;
import java.util.UUID;

@Data
public class NotificationResponse {
    private UUID id;
    private UUID userId;
    private String title;
    private String message;
    private String type;
    private String link;
    private UUID referenceId;
    private Boolean seen;
    private String createdAt;
}
