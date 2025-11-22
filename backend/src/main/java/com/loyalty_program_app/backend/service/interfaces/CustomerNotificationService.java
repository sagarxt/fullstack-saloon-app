package com.loyalty_program_app.backend.service.interfaces;

import com.loyalty_program_app.backend.dto.notification.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerNotificationService {

    Page<NotificationResponse> getNotifications(UUID userId, Pageable pageable);

    void markSeen(UUID userId, UUID notificationId);
}
