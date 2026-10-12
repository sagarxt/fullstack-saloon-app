package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.notification.NotificationResponse;
import com.loyalty_program_app.backend.service.customer.CustomerNotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/notifications")
@RequiredArgsConstructor
public class CustomerNotificationController {

    private final CustomerNotificationService notificationService;

    private UUID getCurrentUserId(HttpServletRequest request) {
        return UUID.fromString((String) request.getAttribute("userId"));
    }

    @GetMapping
    public Page<NotificationResponse> getNotifications(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationService.getNotifications(getCurrentUserId(request), pageable);
    }

    @GetMapping("/unread-count")
    public java.util.Map<String, Long> getUnreadCount(HttpServletRequest request) {
        long count = notificationService.getUnreadCount(getCurrentUserId(request));
        return java.util.Map.of("unreadCount", count);
    }

    @PostMapping("/{id}/seen")
    public void markSeen(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        notificationService.markSeen(getCurrentUserId(request), id);
    }

    @PostMapping("/mark-all-seen")
    public java.util.Map<String, String> markAllSeen(HttpServletRequest request) {
        notificationService.markAllSeen(getCurrentUserId(request));
        return java.util.Map.of("message", "All notifications marked as seen");
    }

    @DeleteMapping
    public java.util.Map<String, String> clearAll(HttpServletRequest request) {
        notificationService.clearAll(getCurrentUserId(request));
        return java.util.Map.of("message", "All notifications cleared");
    }
}
