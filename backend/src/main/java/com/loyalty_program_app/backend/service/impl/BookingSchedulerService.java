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

                // 3) Grace period: Don't trigger reminders for bookings created in the last 5 minutes.
                if (b.getCreatedAt() != null && b.getCreatedAt().isAfter(now.minusMinutes(5))) {
                    continue;
                }

                LocalDateTime scheduledAt = b.getScheduledAt();
                String displayCode = b.getBookingCode() != null ? b.getBookingCode() : "GN-" + b.getId().toString().substring(0, 8).toUpperCase();
                String serviceName = b.getBookingItems().get(0).getServiceNameSnapshot() != null
                        ? b.getBookingItems().get(0).getServiceNameSnapshot() : "Salon Booking";
                String storeName = b.getStoreNameSnapshot() != null ? b.getStoreNameSnapshot() : (b.getStore() != null ? b.getStore().getName() : "Groomish Now Flagship");

                // 1. REMINDER 30 MINUTES BEFORE BOOKING
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
                            .title("Booking in 30 Minutes ⏰")
                            .message("Your booking (" + displayCode + ") for " + serviceName + " at " + storeName + " will start in 30 minutes. See you soon!")
                            .type(NotificationType.BOOKING)
                            .referenceId(b.getId())
                            .link("/customer/bookings/" + b.getId())
                            .build();
                    notificationRepository.save(notif);

                    com.loyalty_program_app.backend.dto.mail.BookingEmailDto dto = com.loyalty_program_app.backend.dto.mail.BookingEmailDto.fromBooking(b);
                    emailService.sendBookingStartingSoonEmail(dto);
                    log.info("Sent 30-minute booking reminder for booking {}", displayCode);
                }

                // 2. AT BOOKING TIME REMINDER
                // Triggered if now is between [scheduledAt] and [scheduledAt + 30 min]
                if (!Boolean.TRUE.equals(b.getReminderStartSent()) &&
                        (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.MODIFIED) &&
                        (now.isEqual(scheduledAt) || now.isAfter(scheduledAt)) &&
                        now.isBefore(scheduledAt.plusMinutes(30))) {

                    b.setReminderStartSent(true);
                    bookingRepository.save(b);

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Your Booking Starts Now! ✂️")
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
                    log.info("Sent starting-now reminder for booking {}", displayCode);
                }

                // 3. 1 HOUR POST-SLOT WARNING: ATTENTION REQUIRED
                // Customer gets warning to reschedule within 2 hours of slot to prevent auto-cancellation.
                // As per business logic: Sent if booking is CONFIRMED or PENDING or MODIFIED, NOT if IN_PROGRESS.
                if (!Boolean.TRUE.equals(b.getWarningPostOneHourSent()) &&
                        b.getStatus() != BookingStatus.IN_PROGRESS &&
                        (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING || b.getStatus() == BookingStatus.MODIFIED) &&
                        now.isAfter(scheduledAt.plusMinutes(60)) &&
                        now.isBefore(scheduledAt.plusMinutes(120))) {

                    b.setWarningPostOneHourSent(true);
                    bookingRepository.save(b);

                    LocalDateTime cutoffTime = scheduledAt.plusHours(2);
                    String cutoffStr = cutoffTime.format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a"));

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Action Required: Missed Check-In ⚠️")
                            .message("Your booking (" + displayCode + ") scheduled at " + scheduledAt.toLocalTime() + " has passed. Please visit by " + cutoffStr + " or reschedule to prevent automatic cancellation.")
                            .type(NotificationType.BOOKING)
                            .referenceId(b.getId())
                            .link("/customer/bookings/" + b.getId() + "?reschedule=true")
                            .build();
                    notificationRepository.save(notif);

                    com.loyalty_program_app.backend.dto.mail.BookingEmailDto dto = com.loyalty_program_app.backend.dto.mail.BookingEmailDto.fromBooking(b);
                    dto.setAutoCancelCutoffTime(cutoffTime);
                    emailService.sendBookingAttentionRequiredEmail(dto);
                    log.info("Sent 1-hour post-slot attention required warning for booking {}", displayCode);
                }

                // 4. 2 HOURS POST-SLOT AUTO-CANCELLATION
                // If 2 hours past scheduled time and customer NEVER checked in (NOT IN_PROGRESS), auto cancel
                if (b.getStatus() != BookingStatus.IN_PROGRESS &&
                        (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING || b.getStatus() == BookingStatus.MODIFIED) &&
                        now.isAfter(scheduledAt.plusMinutes(120))) {

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
                            .title("Booking Auto-Cancelled ❌")
                            .message("Your booking (" + displayCode + ") was automatically cancelled as it was not attended or rescheduled within 2 hours of the slot.")
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
                            "Your booking (" + displayCode + ") was automatically cancelled because it was not attended or rescheduled within 2 hours of your scheduled time."
                    );
                    log.info("Auto-cancelled booking {} past 2-hour window", displayCode);
                }

            } catch (Exception ex) {
                log.error("Error processing lifecycle for booking {}: {}", b.getId(), ex.getMessage());
            }
        }
    }
}
