package com.loyalty_program_app.backend.service.customer;

import com.loyalty_program_app.backend.dto.notification.NotificationResponse;
import com.loyalty_program_app.backend.enums.NotificationType;
import com.loyalty_program_app.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerNotificationService {

    Page<NotificationResponse> getNotifications(UUID userId, Pageable pageable);

    long getUnreadCount(UUID userId);

    void markSeen(UUID userId, UUID notificationId);

    void markAllSeen(UUID userId);

    void clearAll(UUID userId);

    void createNotification(User user, String title, String message, NotificationType type);
}
