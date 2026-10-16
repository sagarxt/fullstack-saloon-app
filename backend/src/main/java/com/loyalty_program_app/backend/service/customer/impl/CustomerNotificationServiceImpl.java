package com.loyalty_program_app.backend.service.customer.impl;

import com.loyalty_program_app.backend.dto.notification.NotificationResponse;
import com.loyalty_program_app.backend.model.Notification;
import com.loyalty_program_app.backend.repository.NotificationRepository;
import com.loyalty_program_app.backend.service.customer.CustomerNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.UUID;

import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.repository.BookingRepository;
import com.loyalty_program_app.backend.repository.NotificationRepository;
import com.loyalty_program_app.backend.service.customer.CustomerNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerNotificationServiceImpl implements CustomerNotificationService {

    private final NotificationRepository notificationRepository;
    private final BookingRepository bookingRepository;

    private static final Pattern BOOKING_CODE_PATTERN = Pattern.compile("GN-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*", Pattern.CASE_INSENSITIVE);
    private static final Pattern UUID_PATTERN = Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

    @Override
    public Page<NotificationResponse> getNotifications(UUID userId, Pageable pageable) {
        Page<Notification> page = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return page.map(n -> toDtoWithAutoResolve(n, userId));
    }

    @Override
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndSeenFalse(userId);
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

    @Override
    public void markAllSeen(UUID userId) {
        notificationRepository.markAllSeenByUserId(userId);
    }

    @Override
    public void clearAll(UUID userId) {
        notificationRepository.deleteAllByUserId(userId);
    }

    @Override
    public void createNotification(com.loyalty_program_app.backend.model.User user, String title, String message, com.loyalty_program_app.backend.enums.NotificationType type) {
        if (user == null) return;
        Notification n = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .seen(false)
                .build();
        notificationRepository.save(n);
    }

    private NotificationResponse toDtoWithAutoResolve(Notification n, UUID userId) {
        // Auto-resolve missing booking UUID references for legacy notifications
        if (n.getReferenceId() == null || n.getLink() == null || n.getLink().isBlank() || !n.getLink().startsWith("/customer/bookings/")) {
            boolean isBookingRelated = n.getType() == com.loyalty_program_app.backend.enums.NotificationType.BOOKING
                    || n.getType() == com.loyalty_program_app.backend.enums.NotificationType.PAYMENT
                    || (n.getTitle() != null && n.getTitle().toLowerCase().contains("appointment"))
                    || (n.getTitle() != null && n.getTitle().toLowerCase().contains("booking"))
                    || (n.getMessage() != null && n.getMessage().toLowerCase().contains("booking"));

            if (isBookingRelated) {
                String fullText = (n.getTitle() != null ? n.getTitle() : "") + " " + (n.getMessage() != null ? n.getMessage() : "");
                Booking matchedBooking = null;

                // 1. Check UUID in text
                Matcher uuidMatcher = UUID_PATTERN.matcher(fullText);
                if (uuidMatcher.find()) {
                    try {
                        UUID parsedId = UUID.fromString(uuidMatcher.group());
                        matchedBooking = bookingRepository.findById(parsedId).orElse(null);
                    } catch (Exception ignored) {}
                }

                // 2. Check Booking Code (e.g. GN-7K-481920 or prefix GN-7K)
                if (matchedBooking == null) {
                    Matcher codeMatcher = BOOKING_CODE_PATTERN.matcher(fullText);
                    if (codeMatcher.find()) {
                        String code = codeMatcher.group();
                        matchedBooking = bookingRepository.findByBookingCodeIgnoreCase(code)
                                .or(() -> bookingRepository.findFirstByBookingCodeStartingWithIgnoreCase(code))
                                .orElse(null);
                    }
                }

                // 3. Fallback to user's latest booking if still null
                if (matchedBooking == null && userId != null) {
                    List<Booking> userBookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
                    if (!userBookings.isEmpty()) {
                        matchedBooking = userBookings.get(0);
                    }
                }

                if (matchedBooking != null) {
                    n.setReferenceId(matchedBooking.getId());
                    n.setLink("/customer/bookings/" + matchedBooking.getId());
                    try {
                        notificationRepository.save(n);
                    } catch (Exception e) {
                        log.warn("Could not save backfilled notification link: {}", e.getMessage());
                    }
                }
            }
        }

        NotificationResponse dto = new NotificationResponse();
        dto.setId(n.getId());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType() != null ? n.getType().name() : "SYSTEM");
        dto.setLink(n.getLink() != null && !n.getLink().isBlank() ? n.getLink() : (n.getReferenceId() != null ? "/customer/bookings/" + n.getReferenceId() : null));
        dto.setReferenceId(n.getReferenceId());
        dto.setSeen(n.isSeen());
        dto.setCreatedAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : "");
        return dto;
    }
}
