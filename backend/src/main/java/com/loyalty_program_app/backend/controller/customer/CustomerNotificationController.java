package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.notification.NotificationResponse;
import com.loyalty_program_app.backend.service.interfaces.CustomerNotificationService;
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

    @PostMapping("/{id}/seen")
    public void markSeen(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        notificationService.markSeen(getCurrentUserId(request), id);
    }
}
