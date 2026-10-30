package com.groomish_now.backend.service.booking.impl;

import com.groomish_now.backend.dto.mail.BookingEmailDto;
import com.groomish_now.backend.enums.PaymentMethod;
import com.groomish_now.backend.enums.PaymentStatus;
import com.groomish_now.backend.model.BookingItem;
import com.groomish_now.backend.model.Payment;
import com.groomish_now.backend.repository.BookingItemRepository;
import com.groomish_now.backend.repository.PaymentRepository;
import com.groomish_now.backend.service.booking.BookingSchedulerService;
import com.groomish_now.backend.service.booking.BookingTimelineService;
import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.enums.NotificationType;
import com.groomish_now.backend.model.Booking;
import com.groomish_now.backend.model.Notification;
import com.groomish_now.backend.repository.BookingRepository;
import com.groomish_now.backend.repository.NotificationRepository;
import com.groomish_now.backend.service.payment.RazorpayRefundService;
import com.groomish_now.backend.service.utils.EmailService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
    private final BookingItemRepository bookingItemRepository;
    private final RazorpayRefundService razorpayRefundService;

    @PostConstruct
    public void init() {
        try {
            cancelOverdueBookings();
        } catch (Exception ex) {
            log.error("Startup overdue booking cancellation check failed: {}", ex.getMessage());
        }
    }

    /**
     * Executes every 60 seconds to process booking lifecycle:
     * 1) Cancel and refund bookings whose date & time crossed >2 hours (MODIFIED, CONFIRMED, PENDING, NO_SHOW)
     * 2) 24h before reminder
     * 3) 2h before reminder
     * 4) 30-min before reminder
     * 5) At booking time reminder (Starts now)
     * 6) 1-hour post-slot warning
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void processAppointmentLifecycle() {
        // 0. Auto-cancel and refund any bookings past the 2-hour window
        cancelOverdueBookings();

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

                // 6. 2 HOURS POST-SLOT: AUTO-CANCELLATION & AUTOMATED REFUND
                // Any booking crossed by >2 hours in MODIFIED, CONFIRMED, PENDING, or NO_SHOW is cancelled
                // and refunded by cancelOverdueBookings() called at each scheduled tick.
                if (b.getStatus() != BookingStatus.IN_PROGRESS &&
                        b.getStatus() != BookingStatus.CHECKED_IN &&
                        b.getCheckedInAt() == null &&
                        (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING ||
                         b.getStatus() == BookingStatus.MODIFIED || b.getStatus() == BookingStatus.NO_SHOW) &&
                        now.isAfter(scheduledAt.plusMinutes(120))) {

                    cancelAndRefundOverdueBooking(b, now);
                }

            } catch (Exception ex) {
                log.error("Error processing lifecycle for booking {}: {}", b.getId(), ex.getMessage());
            }
        }
    }

    /**
     * Finds and cancels all bookings whose scheduled date and time has crossed by more than 2 hours
     * and are in MODIFIED, CONFIRMED, PENDING, or NO_SHOW status.
     * Automatically processes full refund if amount was paid.
     */
    @Override
    @Transactional
    public void cancelOverdueBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2);
        List<Booking> overdueBookings = bookingRepository.findOverdueBookingsForCancellation(cutoff);
        if (overdueBookings.isEmpty()) {
            return;
        }

        log.info("Processing {} overdue bookings (>2h past scheduled time) for auto-cancellation & refund", overdueBookings.size());
        LocalDateTime now = LocalDateTime.now();

        for (Booking b : overdueBookings) {
            try {
                // Ensure customer did not already check in or have services in progress
                if (b.getStatus() == BookingStatus.IN_PROGRESS ||
                        b.getStatus() == BookingStatus.CHECKED_IN ||
                        b.getCheckedInAt() != null) {
                    continue;
                }

                cancelAndRefundOverdueBooking(b, now);
            } catch (Exception ex) {
                log.error("Failed to auto-cancel and refund overdue booking {}: {}", b.getId(), ex.getMessage(), ex);
            }
        }
    }

    private void cancelAndRefundOverdueBooking(Booking b, LocalDateTime now) {
        String displayCode = b.getBookingCode() != null ? b.getBookingCode() : "GN-" + b.getId().toString().substring(0, 8).toUpperCase();
        String serviceName = (b.getBookingItems() != null && !b.getBookingItems().isEmpty() && b.getBookingItems().get(0).getServiceNameSnapshot() != null)
                ? b.getBookingItems().get(0).getServiceNameSnapshot() : "Salon Appointment";
        String storeName = b.getStoreNameSnapshot() != null ? b.getStoreNameSnapshot() : (b.getStore() != null ? b.getStore().getName() : "Groomish Now Flagship");

        Payment payment = b.getPayment();
        double paid = (b.getPricePaid() != null && b.getPricePaid() > 0)
                ? b.getPricePaid()
                : (payment != null && payment.getAmount() != null && payment.getStatus() == PaymentStatus.COMPLETED
                    ? payment.getAmount()
                    : 0.0);

        // 1. Cancel the booking
        b.setStatus(BookingStatus.CANCELLED);
        b.setCancelledAt(now);
        b.setAutoCancelled(true);
        b.setNote("Auto-cancelled: Appointment date and time crossed by more than 2 hours without check-in. Processed for cancellation"
                + (paid > 0.01 ? " and full refund of ₹" + Math.round(paid) + "." : "."));

        // 2. Mark booking items as CANCELLED
        List<BookingItem> items = bookingItemRepository.findByBookingId(b.getId());
        if (items != null && !items.isEmpty()) {
            items.forEach(bi -> bi.setStatus(BookingStatus.CANCELLED));
            bookingItemRepository.saveAll(items);
        }

        // 3. Mark pending payment as FAILED
        if (payment != null && (payment.getStatus() == PaymentStatus.PENDING || payment.getPaymentMethod() == PaymentMethod.CASH)) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }

        // 4. Process refund if amount was paid
        boolean refundHandled = false;
        if (paid > 0.01) {
            if (payment != null && payment.getStatus() == PaymentStatus.COMPLETED &&
                    (payment.getPaymentMethod() == PaymentMethod.ONLINE || payment.getRazorpayPaymentId() != null)) {
                try {
                    razorpayRefundService.initiateCustomRefund(
                            b.getId(),
                            paid,
                            "Auto-refund: Appointment crossed by >2 hours without check-in. Booking auto-cancelled by system."
                    );
                    refundHandled = true;
                    // Re-fetch booking after refund service update
                    b = bookingRepository.findById(b.getId()).orElse(b);
                } catch (Exception ex) {
                    log.warn("Direct Razorpay refund API failed for overdue booking {}: {}. Falling back to internal refund tracking.", b.getId(), ex.getMessage());
                }
            }

            if (!refundHandled) {
                b.setRefundStatus("PROCESSED");
                b.setRefundAmount(paid);
                b.setRefundReason("Auto-refund: Scheduled appointment time crossed 2 hours without check-in");
                b.setRefundedAt(now);
                if (b.getRazorpayRefundId() == null || b.getRazorpayRefundId().isBlank()) {
                    b.setRazorpayRefundId("rfnd_simulated_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
                }
                if (payment != null) {
                    payment.setRefundStatus("PROCESSED");
                    payment.setRefundedAmount(paid);
                    payment.setStatus(PaymentStatus.REFUNDED);
                    payment.setRefundedAt(now);
                    paymentRepository.save(payment);
                }
                bookingTimelineService.recordTimeline(
                        b,
                        "REFUND_PROCESSED",
                        "Refund Processed",
                        "Automated full refund of ₹" + Math.round(paid) + " recorded as appointment crossed 2-hour window.",
                        "System Scheduler",
                        "SYSTEM",
                        "system@groomish.com"
                );
            }
        } else {
            b.setRefundStatus("NONE");
            b.setRefundAmount(0.0);
        }

        bookingRepository.save(b);

        // 5. Record CANCELLED timeline entry
        bookingTimelineService.recordTimeline(
                b,
                "CANCELLED",
                "Auto-Cancelled by System",
                "Appointment was automatically cancelled because scheduled time crossed by more than 2 hours."
                        + (paid > 0.01 ? " Full refund of ₹" + Math.round(paid) + " processed." : " No online payment was made."),
                "System Scheduler",
                "SYSTEM",
                "system@groomish.com"
        );

        // 6. User Notifications & Emails
        if (b.getUser() != null) {
            Notification notif = Notification.builder()
                    .user(b.getUser())
                    .title("Appointment Auto-Cancelled")
                    .message("Your booking (" + displayCode + ") was cancelled as the appointment time passed by more than 2 hours."
                            + (paid > 0.01 ? " A full refund of ₹" + Math.round(paid) + " has been initiated." : ""))
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
                    "CANCELLED",
                    "Your appointment at " + storeName + " was automatically cancelled because the scheduled appointment time passed by more than 2 hours without check-in."
                            + (paid > 0.01 ? " A full refund of ₹" + Math.round(paid) + " has been processed to your original payment method." : "")
            );

            if (b.getUser().getExpoPushToken() != null && !b.getUser().getExpoPushToken().isBlank()) {
                java.util.Map<String, Object> pushData = new java.util.HashMap<>();
                pushData.put("bookingId", b.getId().toString());
                pushData.put("type", "BOOKING_AUTO_CANCELLED");
                expoPushNotificationService.sendPushNotification(
                        b.getUser().getExpoPushToken(),
                        "Appointment Auto-Cancelled",
                        "Booking (" + displayCode + ") cancelled (past 2h). " + (paid > 0.01 ? "Refund of ₹" + Math.round(paid) + " processed." : ""),
                        pushData
                );
            }
        }

        log.info("Auto-cancelled and refunded overdue booking {} (paid: ₹{})", displayCode, paid);
    }
}
