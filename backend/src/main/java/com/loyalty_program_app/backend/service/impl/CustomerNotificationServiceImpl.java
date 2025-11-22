package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.notification.NotificationResponse;
import com.loyalty_program_app.backend.model.Notification;
import com.loyalty_program_app.backend.repository.NotificationRepository;
import com.loyalty_program_app.backend.service.interfaces.CustomerNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerNotificationServiceImpl implements CustomerNotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public Page<NotificationResponse> getNotifications(UUID userId, Pageable pageable) {
        Page<Notification> page = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return page.map(this::toDto);
    }

    @Override
    public void markSeen(UUID userId, UUID notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!n.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not allowed to modify this notification");
        }

        n.setSeen(true);
        notificationRepository.save(n);
    }

    private NotificationResponse toDto(Notification n) {
        NotificationResponse dto = new NotificationResponse();
        dto.setId(n.getId());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType().name());
        dto.setSeen(n.isSeen());
        dto.setCreatedAt(n.getCreatedAt().toString());
        return dto;
    }
}
