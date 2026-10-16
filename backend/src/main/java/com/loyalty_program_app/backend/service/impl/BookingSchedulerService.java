package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.enums.NotificationType;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.Notification;
import com.loyalty_program_app.backend.repository.BookingRepository;
import com.loyalty_program_app.backend.repository.NotificationRepository;
import com.loyalty_program_app.backend.service.utils.EmailService;
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
public class BookingSchedulerService {

    private final BookingRepository bookingRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final com.loyalty_program_app.backend.repository.PaymentRepository paymentRepository;
    private final com.loyalty_program_app.backend.service.BookingTimelineService bookingTimelineService;

    /**
     * Executes every 60 seconds to process appointment lifecycle:
     * 1) 1-hour before reminder
     * 2) At appointment time reminder
     * 3) 1-hour post-slot warning (to reschedule within 2 hours of slot to avoid auto-cancellation)
     * 4) 2-hours post-slot auto-cancellation
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void processAppointmentLifecycle() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> activeBookings = bookingRepository.findAllActiveBookings();

        for (Booking b : activeBookings) {
            try {
                if (b.getScheduledAt() == null || b.getUser() == null) continue;

                // 1) ONLY apply salon appointment lifecycle reminders & warnings to bookings containing actual salon services.
                // Product-only purchases have no stylist or salon slot and must never receive appointment reminders or auto-cancellation.
                if (b.getBookingItems() == null || b.getBookingItems().isEmpty()) {
                    continue;
                }

                // 2) ONLY send reminders for CONFIRMED or MODIFIED bookings. Never for PENDING (unpaid/unconfirmed) orders.
                if (b.getStatus() != BookingStatus.CONFIRMED && b.getStatus() != BookingStatus.MODIFIED) {
                    continue;
                }

                // 3) Grace period: Don't trigger "Starts Now" for appointments created in the last 5 minutes.
                if (b.getCreatedAt() != null && b.getCreatedAt().isAfter(now.minusMinutes(5))) {
                    continue;
                }

                LocalDateTime scheduledAt = b.getScheduledAt();
                String displayCode = b.getBookingCode() != null ? b.getBookingCode() : "GN-" + b.getId().toString().substring(0, 8).toUpperCase();
                String serviceName = b.getBookingItems().get(0).getServiceNameSnapshot() != null
                        ? b.getBookingItems().get(0).getServiceNameSnapshot() : "Salon Appointment";
                String storeName = b.getStoreNameSnapshot() != null ? b.getStoreNameSnapshot() : (b.getStore() != null ? b.getStore().getName() : "Groomish Now Flagship");

                // 1. REMINDER 1 HOUR BEFORE APPOINTMENT
                // Triggered if now is between [scheduledAt - 60 min] and [scheduledAt]
                if (!Boolean.TRUE.equals(b.getReminderOneHourSent()) &&
                        now.isAfter(scheduledAt.minusMinutes(60)) &&
                        now.isBefore(scheduledAt)) {

                    b.setReminderOneHourSent(true);
                    bookingRepository.save(b);

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Appointment in 1 Hour ⏰")
                            .message("Your appointment (" + displayCode + ") for " + serviceName + " at " + storeName + " is scheduled in 1 hour. See you soon!")
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
                            "UPCOMING (1 HOUR REMINDER)",
                            "Your salon appointment at " + storeName + " is starting in 1 hour at " + scheduledAt + ". Please arrive 5-10 minutes prior."
                    );
                    log.info("Sent 1-hour appointment reminder for booking {}", displayCode);
                }

                // 2. AT APPOINTMENT TIME REMINDER
                // Triggered if now is between [scheduledAt] and [scheduledAt + 30 min]
                if (!Boolean.TRUE.equals(b.getReminderStartSent()) &&
                        (now.isEqual(scheduledAt) || now.isAfter(scheduledAt)) &&
                        now.isBefore(scheduledAt.plusMinutes(30))) {

                    b.setReminderStartSent(true);
                    bookingRepository.save(b);

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Your Appointment Starts Now! ✂️")
                            .message("Hi " + b.getUser().getName() + ", your appointment (" + displayCode + ") is starting now at " + storeName + ". Our stylists are ready for you!")
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
                            "Your appointment is starting right now at " + storeName + ". Our styling team is ready to serve you."
                    );
                    log.info("Sent starting-now reminder for booking {}", displayCode);
                }

                // 3. 1 HOUR POST-SLOT WARNING (IF NOT COMPLETED)
                // Customer gets warning to reschedule within 2 hours of slot to prevent auto-cancellation
                if (!Boolean.TRUE.equals(b.getWarningPostOneHourSent()) &&
                        now.isAfter(scheduledAt.plusMinutes(60)) &&
                        now.isBefore(scheduledAt.plusMinutes(120))) {

                    b.setWarningPostOneHourSent(true);
                    bookingRepository.save(b);

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Action Required: Reschedule Appointment ⚠️")
                            .message("Your appointment (" + displayCode + ") scheduled at " + scheduledAt.toLocalTime() + " has passed. Please reschedule or check in within your 2-hour grace period to prevent automatic cancellation.")
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
                            "URGENT: RESCHEDULE WARNING",
                            "Your scheduled appointment at " + scheduledAt + " has passed and was not checked in. Please reschedule your booking within 2 hours of your original slot to prevent automatic cancellation."
                    );
                    log.info("Sent 1-hour post-slot warning for booking {}", displayCode);
                }

                // 4. 2 HOURS POST-SLOT AUTO-CANCELLATION
                // If 2 hours past scheduled time and not completed, auto cancel
                if (now.isAfter(scheduledAt.plusMinutes(120))) {
                    b.setStatus(BookingStatus.CANCELLED);
                    b.setCancelledAt(now);
                    b.setAutoCancelled(true);
                    b.setNote("Auto-cancelled: Client did not check in or reschedule within 2-hour grace period.");
                    if (b.getPayment() != null) {
                        var p = b.getPayment();
                        if (p.getStatus() == com.loyalty_program_app.backend.enums.PaymentStatus.PENDING ||
                            p.getPaymentMethod() == com.loyalty_program_app.backend.enums.PaymentMethod.CASH) {
                            p.setStatus(com.loyalty_program_app.backend.enums.PaymentStatus.FAILED);
                            paymentRepository.save(p);
                        }
                    }
                    bookingRepository.save(b);

                    bookingTimelineService.recordTimeline(
                            b,
                            "CANCELLED",
                            "Auto-Cancelled by System",
                            "Automatically cancelled: Client did not check in or reschedule within 2 hours of scheduled slot.",
                            "System Scheduler",
                            "SYSTEM",
                            "system@groomish.com"
                    );

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Appointment Auto-Cancelled ❌")
                            .message("Your appointment (" + displayCode + ") was automatically cancelled as it was not attended or rescheduled within 2 hours of the slot.")
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
                            "AUTO_CANCELLED",
                            "Your appointment (" + displayCode + ") was automatically cancelled because it was not attended or rescheduled within 2 hours of your scheduled time."
                    );
                    log.info("Auto-cancelled booking {} past 2-hour window", displayCode);
                }

            } catch (Exception ex) {
                log.error("Error processing lifecycle for booking {}: {}", b.getId(), ex.getMessage());
            }
        }
    }
}
