package com.loyalty_program_app.backend.service.utils;

import com.loyalty_program_app.backend.dto.mail.BillItemDto;
import com.loyalty_program_app.backend.dto.mail.BookingEmailDto;
import java.time.LocalDateTime;
import java.util.List;

public interface EmailService {

    void sendHtmlEmail(String to, String subject, String htmlContent);

    void sendWelcomeEmail(String to, String name, String referralCode);

    // Rich Booking emails
    void sendBookingConfirmationEmail(BookingEmailDto dto);

    void sendBookingConfirmationEmail(String to, String name, String bookingId, String serviceName, LocalDateTime scheduledAt, Double pricePaid);

    void sendBookingStartingSoonEmail(BookingEmailDto dto);

    void sendBookingModifiedEmail(BookingEmailDto dto, boolean isAdminOverride);

    void sendBookingAttentionRequiredEmail(BookingEmailDto dto);

    void sendBookingCompletedEmail(BookingEmailDto dto);

    void sendBookingStatusEmail(String to, String name, String bookingId, String serviceName, String status, String note);

    void sendBookingAdminOverrideEmail(
            String to,
            String name,
            String bookingId,
            String bookingCode,
            String serviceName,
            String storeName,
            LocalDateTime scheduledAt,
            String status,
            Double pricePaid,
            String paymentStatus,
            String paymentMethod,
            String adminNote
    );

    void sendRewardRedeemedEmail(String to, String name, String rewardTitle, int pointsSpent, int remainingPoints);

    void sendVoucherClaimedEmail(
            String to,
            String name,
            String voucherCode,
            String title,
            String description,
            Integer discountPercent,
            LocalDateTime expiresAt,
            String eligibleDetails
    );

    void sendPasswordChangedEmail(String to, String name);

    void sendReferralBonusEmail(String to, String referrerName, String referredFriendName, int pointsEarned, int totalPointsBalance);

    void sendPaymentBillEmail(
            String to,
            String name,
            String invoiceNumber,
            String bookingId,
            List<BillItemDto> items,
            Double subtotal,
            Double discount,
            Double tax,
            Double totalAmount,
            String paymentMethod,
            int pointsEarned,
            LocalDateTime completedAt
    );
}
