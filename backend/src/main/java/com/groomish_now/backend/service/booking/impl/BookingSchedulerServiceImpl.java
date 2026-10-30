package com.groomish_now.backend.service.booking.impl;

import com.groomish_now.backend.dto.mail.BookingEmailDto;
import com.groomish_now.backend.enums.PaymentMethod;
import com.groomish_now.backend.enums.PaymentStatus;
import com.groomish_now.backend.repository.PaymentRepository;
import com.groomish_now.backend.service.booking.BookingSchedulerService;
import com.groomish_now.backend.service.booking.BookingTimelineService;
import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.enums.NotificationType;
import com.groomish_now.backend.model.Booking;
import com.groomish_now.backend.model.Notification;
import com.groomish_now.backend.repository.BookingRepository;
import com.groomish_now.backend.repository.NotificationRepository;
import com.groomish_now.backend.service.utils.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingSchedulerServiceImpl implements BookingSchedulerService {

    private final BookingRepository bookingRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final PaymentRepository paymentRepository;
    private final BookingTimelineService bookingTimelineService;
    private final com.groomish_now.backend.service.notification.ExpoPushNotificationService expoPushNotificationService;

    /**
     * Executes every 60 seconds to process booking lifecycle:
     * 1) 30-min before reminder (Starts in 30 minutes)
     * 2) At booking time reminder (Starts now)
     * 3) 1-hour post-slot warning (Attention Required: auto-cancel in 1 hour if not visited/checked in)
     * 4) 2-hours post-slot auto-cancellation (Only if not checked in / not IN_PROGRESS)
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void processAppointmentLifecycle() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> activeBookings = bookingRepository.findAllActiveBookings();

        for (Booking b : activeBookings) {
            try {
                if (b.getScheduledAt() == null || b.getUser() == null) continue;

                // 1) ONLY apply salon booking lifecycle reminders & warnings to bookings containing salon services.
                // Product-only purchases have no stylist or salon slot and must never receive booking reminders or auto-cancellation.
                if (b.getBookingItems() == null || b.getBookingItems().isEmpty()) {
                    continue;
                }

                // 2) Skip if already cancelled or completed
                if (b.getStatus() == BookingStatus.CANCELLED || b.getStatus() == BookingStatus.COMPLETED) {
                    continue;
                }

                // 3) CRITICAL: If customer has already checked in or services are in progress,
                // do NOT send any reminders, warnings, or auto-cancellations as client is already at the salon!
                if (b.getStatus() == BookingStatus.CHECKED_IN ||
                        b.getStatus() == BookingStatus.IN_PROGRESS ||
                        b.getCheckedInAt() != null) {
                    continue;
                }

                // 4) Grace period: Don't trigger reminders for bookings created in the last 5 minutes.
                if (b.getCreatedAt() != null && b.getCreatedAt().isAfter(now.minusMinutes(5))) {
                    continue;
                }

                LocalDateTime scheduledAt = b.getScheduledAt();
                String displayCode = b.getBookingCode() != null ? b.getBookingCode() : "GN-" + b.getId().toString().substring(0, 8).toUpperCase();
                String serviceName = b.getBookingItems().get(0).getServiceNameSnapshot() != null
                        ? b.getBookingItems().get(0).getServiceNameSnapshot() : "Salon Booking";
                String storeName = b.getStoreNameSnapshot() != null ? b.getStoreNameSnapshot() : (b.getStore() != null ? b.getStore().getName() : "Groomish Now Flagship");

                // 1. REMINDER 24 HOURS BEFORE BOOKING
                // Triggered if now is between [scheduledAt - 25 hours] and [scheduledAt - 23 hours]
                if (!Boolean.TRUE.equals(b.getReminder24hSent()) &&
                        (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.MODIFIED) &&
                        now.isAfter(scheduledAt.minusHours(25)) &&
                        now.isBefore(scheduledAt.minusHours(23))) {

                    b.setReminder24hSent(true);
                    bookingRepository.save(b);

                    String timeStr = scheduledAt.toLocalTime().format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a"));
                    String notifMsg = "Your booking (" + displayCode + ") for " + serviceName + " at " + storeName + " is scheduled for tomorrow at " + timeStr + ". Free cancellation available up to 2h before.";

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Appointment Tomorrow at " + timeStr)
                            .message(notifMsg)
                            .type(NotificationType.BOOKING)
                            .referenceId(b.getId())
                            .link("/customer/bookings/" + b.getId())
                            .build();
                    notificationRepository.save(notif);

                    BookingEmailDto dto = BookingEmailDto.fromBooking(b);
                    emailService.sendAppointmentReminder24hEmail(dto);

                    if (b.getUser().getExpoPushToken() != null && !b.getUser().getExpoPushToken().isBlank()) {
                        java.util.Map<String, Object> pushData = new java.util.HashMap<>();
                        pushData.put("bookingId", b.getId().toString());
                        pushData.put("type", "BOOKING_REMINDER_24H");
                        expoPushNotificationService.sendPushNotification(
                                b.getUser().getExpoPushToken(),
                                "Appointment Tomorrow at " + timeStr,
                                "Your booking (" + displayCode + ") at " + storeName + " is scheduled for tomorrow. Free cancellation up to 2h before slot.",
                                pushData
                        );
                    }

                    bookingTimelineService.recordTimeline(
                            b,
                            "REMINDER_24H",
                            "24-Hour Reminder Dispatched",
                            "Automated 24h reminder sent via push & email. No-show and cancellation policy communicated.",
                            "System Scheduler",
                            "SYSTEM",
                            "system@groomish.com"
                    );

                    log.info("Sent 24-hour booking reminder for booking {}", displayCode);
                }

                // 2. REMINDER 2 HOURS BEFORE BOOKING
                // Triggered if now is between [scheduledAt - 135 minutes] and [scheduledAt - 105 minutes]
                if (!Boolean.TRUE.equals(b.getReminder2hSent()) &&
                        (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.MODIFIED) &&
                        now.isAfter(scheduledAt.minusMinutes(135)) &&
                        now.isBefore(scheduledAt.minusMinutes(105))) {

                    b.setReminder2hSent(true);
                    bookingRepository.save(b);

                    String timeStr = scheduledAt.toLocalTime().format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a"));
                    String notifMsg = "Your booking (" + displayCode + ") starts in 2 hours at " + storeName + ". The free cancellation window is now closed. Please arrive on time!";

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Appointment in 2 Hours! ⏳")
                            .message(notifMsg)
                            .type(NotificationType.BOOKING)
                            .referenceId(b.getId())
                            .link("/customer/bookings/" + b.getId())
                            .build();
                    notificationRepository.save(notif);

                    BookingEmailDto dto = BookingEmailDto.fromBooking(b);
                    emailService.sendAppointmentReminder2hEmail(dto);

                    if (b.getUser().getExpoPushToken() != null && !b.getUser().getExpoPushToken().isBlank()) {
                        java.util.Map<String, Object> pushData = new java.util.HashMap<>();
                        pushData.put("bookingId", b.getId().toString());
                        pushData.put("type", "BOOKING_REMINDER_2H");
                        expoPushNotificationService.sendPushNotification(
                                b.getUser().getExpoPushToken(),
                                "Appointment in 2 Hours! ⏳",
                                "Your stylist is getting ready at " + storeName + ". Free cancellation closed; see you at " + timeStr + "!",
                                pushData
                        );
                    }

                    bookingTimelineService.recordTimeline(
                            b,
                            "REMINDER_2H",
                            "2-Hour Reminder Dispatched",
                            "Automated 2h reminder sent via push & email. Free cancellation cutoff reached.",
                            "System Scheduler",
                            "SYSTEM",
                            "system@groomish.com"
                    );

                    log.info("Sent 2-hour booking reminder for booking {}", displayCode);
                }

                // 3. REMINDER 30 MINUTES BEFORE BOOKING
                // Triggered if now is between [scheduledAt - 35 min] and [scheduledAt]
                if (!Boolean.TRUE.equals(b.getReminderThirtyMinSent()) &&
                        (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.MODIFIED) &&
                        now.isAfter(scheduledAt.minusMinutes(35)) &&
                        now.isBefore(scheduledAt)) {

                    b.setReminderThirtyMinSent(true);
                    b.setReminderOneHourSent(true);
                    bookingRepository.save(b);

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Booking in 30 Minutes!")
                            .message("Your booking (" + displayCode + ") for " + serviceName + " at " + storeName + " will start in 30 minutes. See you soon!")
                            .type(NotificationType.BOOKING)
                            .referenceId(b.getId())
                            .link("/customer/bookings/" + b.getId())
                            .build();
                    notificationRepository.save(notif);

                    BookingEmailDto dto = BookingEmailDto.fromBooking(b);
                    emailService.sendBookingStartingSoonEmail(dto);

                    if (b.getUser().getExpoPushToken() != null && !b.getUser().getExpoPushToken().isBlank()) {
                        java.util.Map<String, Object> pushData = new java.util.HashMap<>();
                        pushData.put("bookingId", b.getId().toString());
                        pushData.put("type", "BOOKING_REMINDER_30M");
                        expoPushNotificationService.sendPushNotification(
                                b.getUser().getExpoPushToken(),
                                "Booking in 30 Minutes! ⏰",
                                "Your appointment (" + displayCode + ") starts in 30 minutes at " + storeName + ".",
                                pushData
                        );
                    }

                    log.info("Sent 30-minute booking reminder for booking {}", displayCode);
                }

                // 4. AT BOOKING TIME REMINDER
                // Triggered if now is between [scheduledAt] and [scheduledAt + 30 min]
                if (!Boolean.TRUE.equals(b.getReminderStartSent()) &&
                        (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.MODIFIED) &&
                        (now.isEqual(scheduledAt) || now.isAfter(scheduledAt)) &&
                        now.isBefore(scheduledAt.plusMinutes(30))) {

                    b.setReminderStartSent(true);
                    bookingRepository.save(b);

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Your Booking Starts Now!")
                            .message("Hi " + b.getUser().getName() + ", your booking (" + displayCode + ") is starting now at " + storeName + ". Our stylists are ready for you!")
                            .type(NotificationType.BOOKING)
                            .referenceId(b.getId())
                            .link("/customer/bookings/" + b.getId())
                            .build();
                    notificationRepository.save(notif);

                    emailService.sendBookingStatusEmail(
                            b.getUser().getEmail(),
                            b.getUser().getName(),
                            displayCode,
                            serviceName,
                            "STARTING NOW",
                            "Your booking is starting right now at " + storeName + ". Our styling team is ready to serve you."
                    );

                    if (b.getUser().getExpoPushToken() != null && !b.getUser().getExpoPushToken().isBlank()) {
                        java.util.Map<String, Object> pushData = new java.util.HashMap<>();
                        pushData.put("bookingId", b.getId().toString());
                        pushData.put("type", "BOOKING_STARTING_NOW");
                        expoPushNotificationService.sendPushNotification(
                                b.getUser().getExpoPushToken(),
                                "Your Booking Starts Now!",
                                "Our styling team is ready to welcome you at " + storeName + "!",
                                pushData
                        );
                    }

                    log.info("Sent starting-now reminder for booking {}", displayCode);
                }

                // 5. 1 HOUR POST-SLOT WARNING: ATTENTION REQUIRED
                // Customer gets warning to reschedule within 2 hours of slot to prevent auto-cancellation.
                if (!Boolean.TRUE.equals(b.getWarningPostOneHourSent()) &&
                        b.getStatus() != BookingStatus.IN_PROGRESS &&
                        b.getStatus() != BookingStatus.CHECKED_IN &&
                        b.getCheckedInAt() == null &&
                        (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING || b.getStatus() == BookingStatus.MODIFIED) &&
                        now.isAfter(scheduledAt.plusMinutes(60)) &&
                        now.isBefore(scheduledAt.plusMinutes(120))) {

                    b.setWarningPostOneHourSent(true);
                    bookingRepository.save(b);

                    LocalDateTime cutoffTime = scheduledAt.plusHours(2);
                    String cutoffStr = cutoffTime.format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a"));

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Action Required: Missed Check-In!")
                            .message("Your booking (" + displayCode + ") scheduled at " + scheduledAt.toLocalTime() + " has passed. Please visit by " + cutoffStr + " or reschedule to prevent deposit forfeiture.")
                            .type(NotificationType.BOOKING)
                            .referenceId(b.getId())
                            .link("/customer/bookings/" + b.getId() + "?reschedule=true")
                            .build();
                    notificationRepository.save(notif);

                    BookingEmailDto dto = BookingEmailDto.fromBooking(b);
                    dto.setAutoCancelCutoffTime(cutoffTime);
                    emailService.sendBookingAttentionRequiredEmail(dto);

                    if (b.getUser().getExpoPushToken() != null && !b.getUser().getExpoPushToken().isBlank()) {
                        java.util.Map<String, Object> pushData = new java.util.HashMap<>();
                        pushData.put("bookingId", b.getId().toString());
                        pushData.put("type", "BOOKING_ATTENTION_REQUIRED");
                        expoPushNotificationService.sendPushNotification(
                                b.getUser().getExpoPushToken(),
                                "Action Required: Missed Check-In! ⚠️",
                                "Your booking (" + displayCode + ") has passed scheduled time. Please check in by " + cutoffStr + " to prevent deposit forfeiture.",
                                pushData
                        );
                    }

                    log.info("Sent 1-hour post-slot attention required warning for booking {}", displayCode);
                }

                // 6. 2 HOURS POST-SLOT: NO-SHOW AUTO-CANCELLATION & DEPOSIT FORFEITURE
                // If 2 hours past scheduled time and customer NEVER checked in (NOT IN_PROGRESS / NOT CHECKED_IN), record as NO_SHOW
                if (b.getStatus() != BookingStatus.IN_PROGRESS &&
                        b.getStatus() != BookingStatus.CHECKED_IN &&
                        b.getCheckedInAt() == null &&
                        (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING || b.getStatus() == BookingStatus.MODIFIED) &&
                        now.isAfter(scheduledAt.plusMinutes(120))) {

                    b.setStatus(BookingStatus.NO_SHOW);
                    b.setCancelledAt(now);
                    b.setAutoCancelled(true);
                    b.setNote("Recorded as No-Show: Client did not check in or reschedule within 2-hour grace period. Advance deposit forfeited per policy.");
                    if (b.getPayment() != null) {
                        var p = b.getPayment();
                        if (p.getStatus() == PaymentStatus.PENDING ||
                            p.getPaymentMethod() == PaymentMethod.CASH) {
                            p.setStatus(PaymentStatus.FAILED);
                            paymentRepository.save(p);
                        }
                    }
                    bookingRepository.save(b);

                    bookingTimelineService.recordTimeline(
                            b,
                            "NO_SHOW",
                            "Recorded as No-Show by System",
                            "Automatically recorded as No-Show: Client did not arrive or reschedule within 2-hour grace period. Advance deposit forfeited per salon policy.",
                            "System Scheduler",
                            "SYSTEM",
                            "system@groomish.com"
                    );

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Appointment Recorded as No-Show")
                            .message("Your booking (" + displayCode + ") was recorded as a No-Show. Advance booking deposit forfeited per policy.")
                            .type(NotificationType.BOOKING)
                            .referenceId(b.getId())
                            .link("/customer/bookings/" + b.getId())
                            .build();
                    notificationRepository.save(notif);

                    BookingEmailDto dto = BookingEmailDto.fromBooking(b);
                    emailService.sendBookingNoShowEmail(dto);

                    if (b.getUser().getExpoPushToken() != null && !b.getUser().getExpoPushToken().isBlank()) {
                        java.util.Map<String, Object> pushData = new java.util.HashMap<>();
                        pushData.put("bookingId", b.getId().toString());
                        pushData.put("type", "BOOKING_NO_SHOW");
                        expoPushNotificationService.sendPushNotification(
                                b.getUser().getExpoPushToken(),
                                "Appointment Recorded as No-Show",
                                "Your booking (" + displayCode + ") was recorded as a No-Show. Advance deposit forfeited per policy.",
                                pushData
                        );
                    }

                    log.info("Recorded booking {} as NO_SHOW past 2-hour window", displayCode);
                }

            } catch (Exception ex) {
                log.error("Error processing lifecycle for booking {}: {}", b.getId(), ex.getMessage());
            }
        }
    }
}
