package com.loyalty_program_app.backend.service.utils.impl;

import com.loyalty_program_app.backend.dto.mail.BillItemDto;
import com.loyalty_program_app.backend.service.utils.EmailService;
import com.loyalty_program_app.backend.service.utils.EmailTemplateService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final EmailTemplateService templateService;

    @Value("${spring.mail.username:testmailemployee@gmail.com}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEEE, MMM dd, yyyy 'at' hh:mm a");
    private static final DateTimeFormatter INVOICE_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    @Override
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            String sanitizedSubject = sanitizeSubject(subject);
            log.info("Sending real-time Groomish Now email to: {}, Subject: {}", to, sanitizedSubject);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "Groomish Now");
            helper.setTo(to);
            helper.setSubject(sanitizedSubject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Groomish Now email successfully sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send Groomish Now email to {}: {}", to, e.getMessage());
        }
    }

    private String sanitizeSubject(String subject) {
        if (subject == null) {
            return "";
        }
        // Remove emoji / pictographic characters, dingbats, surrogate pairs, and symbols
        String cleaned = subject.replaceAll("[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]|[\\u2600-\\u27BF]|[\\u2300-\\u23FF]|[\\u2B00-\\u2BFF]|[\\uFE00-\\uFE0F]|[\\u200D]", "");
        return cleaned.replaceAll("\\s+", " ").trim();
    }

    @Override
    @Async
    public void sendWelcomeEmail(String to, String name, String referralCode) {
        String subject = "Welcome to Groomish Now Loyalty Club - Groomish Now";
        String body = "<div style='color: #373A43;'>"
                + "<h2 style='color: #FC6957; margin-top: 0; font-size: 20px;'>Welcome to Groomish Now, " + name + "!</h2>"
                + "<p>We are thrilled to welcome you to our exclusive salon loyalty program. Every appointment you book and retail product you purchase earns you Groomish Rewards points redeemable for treatments and beauty care.</p>"
                + "<div style='background: #373A43; color: #FFF; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center; border: 1px solid #FC6957;'>"
                + "<p style='margin: 0 0 6px 0; color: #FED652; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;'>Your VIP Referral Code</p>"
                + "<span style='font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #FFF; display: block; font-family: monospace;'>" + (referralCode != null ? referralCode : "GROOM50") + "</span>"
                + "<p style='margin: 8px 0 0 0; color: #D5D8DF; font-size: 12px;'>Share this code with friends and family to earn bonus Groomish reward points on their first visit!</p>"
                + "</div>"
                + "<p>Browse our curated specialties or beauty shop and book your next salon experience today.</p>"
                + "<p style='margin-top: 24px; font-size: 13px;'>Warm regards,<br><strong style='color: #373A43;'>The Groomish Now Team</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendBookingConfirmationEmail(String to, String name, String bookingId, String serviceName, LocalDateTime scheduledAt, Double pricePaid) {
        String formattedDate = scheduledAt != null ? scheduledAt.format(DATE_FORMATTER) : "Scheduled Soon";
        String displayCode = bookingId != null && !bookingId.isBlank() ? bookingId : "BK-ID-UNKNOWN";
        String subject = "Booking Confirmed: " + displayCode + " - Groomish Now";

        String body = "<div style='color: #373A43;'>"
                + "<h2 style='color: #FC6957; margin-top: 0; font-size: 20px;'>Your Appointment is Confirmed!</h2>"
                + "<p>Dear " + name + ",</p>"
                + "<p>Thank you for choosing Groomish Now. Your appointment has been confirmed with our certified stylists:</p>"
                + "<table style='width: 100%; border-collapse: collapse; margin: 20px 0; background: #FAF6ED; border-radius: 12px; overflow: hidden;'>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89;'>Booking Ref:</td><td style='padding: 12px 16px; color: #373A43; font-weight: 700;'>" + bookingId + "</td></tr>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89;'>Treatment:</td><td style='padding: 12px 16px; color: #FC6957; font-weight: 700;'>" + serviceName + "</td></tr>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89;'>Date & Time:</td><td style='padding: 12px 16px; color: #373A43; font-weight: 700;'>" + formattedDate + "</td></tr>"
                + "<tr><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89;'>Amount:</td><td style='padding: 12px 16px; color: #373A43; font-weight: 800; font-size: 16px;'>₹" + (pricePaid != null ? String.format("%.2f", pricePaid) : "0.00") + "</td></tr>"
                + "</table>"
                + "<p style='color: #7A7E89; font-size: 13px;'>Please arrive 10 minutes prior to your time. You can reschedule or view appointment details anytime in your profile.</p>"
                + "<p style='margin-top: 24px; font-size: 13px;'>Looking forward to serving you,<br><strong style='color: #373A43;'>Groomish Now Salon Team</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendBookingStatusEmail(String to, String name, String bookingId, String serviceName, String status, String note) {
        String displayCode = bookingId != null && !bookingId.isBlank() ? bookingId : "BK-ID-UNKNOWN";
        String subject;
        if (status != null && (status.equalsIgnoreCase("CANCELLED") || status.equalsIgnoreCase("CANCELED") || status.equalsIgnoreCase("AUTO_CANCELLED"))) {
            subject = "Booking Canceled: " + displayCode + " - Groomish Now";
        } else if (status != null && (status.equalsIgnoreCase("MODIFIED") || status.equalsIgnoreCase("RESCHEDULED"))) {
            subject = "Booking Modified: " + displayCode + " - Groomish Now";
        } else if (status != null && status.equalsIgnoreCase("CONFIRMED")) {
            subject = "Booking Confirmed: " + displayCode + " - Groomish Now";
        } else if (status != null && status.equalsIgnoreCase("COMPLETED")) {
            subject = "Booking Completed: " + displayCode + " - Groomish Now";
        } else {
            subject = "Booking Update: " + displayCode + " - Groomish Now";
        }
        String statusColor = ("CANCELLED".equalsIgnoreCase(status) || "CANCELED".equalsIgnoreCase(status) || "AUTO_CANCELLED".equalsIgnoreCase(status)) ? "#EA4158" : "#207FBD";

        String body = "<div style='color: #373A43;'>"
                + "<h2 style='color: " + statusColor + "; margin-top: 0; font-size: 20px;'>Appointment Update: " + status + "</h2>"
                + "<p>Dear " + name + ",</p>"
                + "<p>This is to inform you that your booking status for <strong>" + serviceName + "</strong> (Ref: " + bookingId + ") has been updated to <strong style='color: " + statusColor + ";'>" + status + "</strong>.</p>"
                + (note != null && !note.isBlank() ? "<p style='background: #FAF6ED; padding: 14px; border-left: 4px solid " + statusColor + "; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #373A43;'>" + note + "</p>" : "")
                + ("COMPLETED".equalsIgnoreCase(status) ? (
                    "<div style='background: #FAF6ED; border: 1px dashed #FC6957; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;'>"
                    + "<h3 style='margin: 0 0 6px 0; font-size: 16px; color: #373A43; font-weight: 800;'>How was your appointment today?</h3>"
                    + "<p style='margin: 0 0 14px 0; font-size: 13px; color: #7A7E89;'>Your honest feedback helps us recognize our stylists and maintain the highest standard of service.</p>"
                    + "<a href='" + frontendUrl + "/customer/bookings/" + bookingId + "?review=true' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(252, 105, 87, 0.3);'>Please Review Your Experience</a>"
                    + "</div>"
                ) : "")
                + "<p style='color: #7A7E89; font-size: 13px;'>If you have any questions or require assistance, please contact our salon desk.</p>"
                + "<p style='margin-top: 24px; font-size: 13px;'>Warm regards,<br><strong style='color: #373A43;'>Groomish Now Team</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendBookingAdminOverrideEmail(
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
    ) {
        String formattedDate = scheduledAt != null ? scheduledAt.format(DATE_FORMATTER) : "Pending Schedule";
        String displayCode = bookingCode != null && !bookingCode.isBlank() ? bookingCode : (bookingId != null && !bookingId.isBlank() ? bookingId : "BK-ID-UNKNOWN");
        String subject = "Booking Modified: " + displayCode + " - Groomish Now";

        String statusBadgeColor = "#207FBD";
        if ("COMPLETED".equalsIgnoreCase(status)) statusBadgeColor = "#34A955";
        else if ("CANCELLED".equalsIgnoreCase(status) || "CANCELED".equalsIgnoreCase(status)) statusBadgeColor = "#EA4158";
        else if ("CONFIRMED".equalsIgnoreCase(status)) statusBadgeColor = "#FC6957";

        String body = "<div style='color: #373A43; font-family: sans-serif;'>"
                + "<div style='display: inline-block; padding: 5px 14px; background: #FFF3CD; color: #856404; font-size: 11px; font-weight: 800; border-radius: 20px; border: 1px solid #FFEEBA; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;'>Admin Notice</div>"
                + "<h2 style='color: #FC6957; margin-top: 0; font-size: 20px; font-weight: 800;'>Your Appointment Details Have Been Updated</h2>"
                + "<p style='font-size: 14px; margin-bottom: 6px;'>Dear <strong>" + name + "</strong>,</p>"
                + "<p style='font-size: 13px; color: #555; line-height: 1.6;'>Please be informed that an administrator has updated your salon appointment details at Groomish Now:</p>"
                + "<table style='width: 100%; border-collapse: collapse; margin: 20px 0; background: #FAF6ED; border-radius: 12px; overflow: hidden;'>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89; width: 38%; font-size: 13px;'>Booking Reference:</td><td style='padding: 12px 16px; color: #373A43; font-weight: 800; font-family: monospace; font-size: 14px;'>" + displayCode + "</td></tr>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89; font-size: 13px;'>Treatment Service(s):</td><td style='padding: 12px 16px; color: #FC6957; font-weight: 700; font-size: 13px;'>" + serviceName + "</td></tr>"
                + (storeName != null && !storeName.isBlank() ? "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89; font-size: 13px;'>Salon Branch:</td><td style='padding: 12px 16px; color: #373A43; font-weight: 700; font-size: 13px;'>" + storeName + "</td></tr>" : "")
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89; font-size: 13px;'>Updated Schedule:</td><td style='padding: 12px 16px; color: #373A43; font-weight: 700; font-size: 13px;'>" + formattedDate + "</td></tr>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89; font-size: 13px;'>Current Status:</td><td style='padding: 12px 16px;'><span style='background: " + statusBadgeColor + "; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-weight: 800; font-size: 11px; text-transform: uppercase; display: inline-block;'>" + status + "</span></td></tr>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89; font-size: 13px;'>Total / Price Paid:</td><td style='padding: 12px 16px; color: #373A43; font-weight: 800; font-size: 15px;'>₹" + (pricePaid != null ? String.format("%.2f", pricePaid) : "0.00") + "</td></tr>"
                + (paymentMethod != null || paymentStatus != null ? "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89; font-size: 13px;'>Payment:</td><td style='padding: 12px 16px; color: #373A43; font-size: 13px; font-weight: 600;'>" + (paymentMethod != null ? paymentMethod : "CASH") + " (" + (paymentStatus != null ? paymentStatus : "PENDING") + ")</td></tr>" : "")
                + (adminNote != null && !adminNote.isBlank() ? "<tr><td style='padding: 12px 16px; font-weight: 600; color: #7A7E89; font-size: 13px;'>Admin Notes:</td><td style='padding: 12px 16px; color: #856404; background: #FFF3CD; font-size: 13px; font-weight: 600; font-style: italic;'>" + adminNote + "</td></tr>" : "")
                + "</table>"
                + "<div style='background: #F8F9FA; border-left: 4px solid #FC6957; padding: 14px 18px; border-radius: 6px; margin: 18px 0; font-size: 13px; color: #555;'>"
                + "<strong>(Overrided by Administrator)</strong><br><span style='font-size: 12px; color: #777;'>These modifications were made and saved via administrative salon controls.</span>"
                + "</div>"
                + "<div style='margin: 24px 0; text-align: center;'>"
                + "<a href='" + frontendUrl + "/customer/bookings/" + bookingId + "' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(252, 105, 87, 0.3);'>View Updated Appointment</a>"
                + "</div>"
                + "<p style='color: #7A7E89; font-size: 12px; line-height: 1.5;'>If you have questions regarding this change or need further assistance, please contact salon reception or reply to this email.</p>"
                + "<p style='margin-top: 24px; font-size: 13px;'>Warm regards,<br><strong style='color: #373A43;'>Groomish Now Administration Team</strong><br><span style='font-size: 11px; color: #888; font-weight: 600;'>below (Overrided by Administrator)</span></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendRewardRedeemedEmail(String to, String name, String rewardTitle, int pointsSpent, int remainingPoints) {
        String subject = "Perk Redeemed: " + rewardTitle + " - Groomish Now";

        String body = "<div style='color: #373A43;'>"
                + "<h2 style='color: #FC6957; margin-top: 0; font-size: 20px;'>Congratulations on Your Reward!</h2>"
                + "<p>Dear " + name + ",</p>"
                + "<p>You have successfully redeemed <strong>" + rewardTitle + "</strong> using your Groomish loyalty points.</p>"
                + "<div style='background: #FAF6ED; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid rgba(55,58,67,0.1);'>"
                + "<p style='margin: 4px 0; font-size: 13px;'><strong>Points Redeemed:</strong> <span style='color: #EA4158; font-weight: 700;'>-" + pointsSpent + " pts</span></p>"
                + "<p style='margin: 4px 0; font-size: 13px;'><strong>Remaining Points Balance:</strong> <span style='color: #34A955; font-weight: 700;'>" + remainingPoints + " pts</span></p>"
                + "</div>"
                + "<p style='font-size: 13px; color: #7A7E89;'>Present this confirmation code at your next salon visit to claim your perk.</p>"
                + "<p style='margin-top: 24px; font-size: 13px;'>Cheers,<br><strong style='color: #373A43;'>Groomish Now Loyalty Team</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendPasswordChangedEmail(String to, String name) {
        String subject = "Security Alert: Your Password Was Changed - Groomish Now";

        String body = "<div style='color: #373A43;'>"
                + "<h2 style='color: #373A43; margin-top: 0; font-size: 20px;'>Security Notification</h2>"
                + "<p>Hello " + name + ",</p>"
                + "<p>Your password for Groomish Now was successfully updated on " + LocalDateTime.now().format(DATE_FORMATTER) + ".</p>"
                + "<p style='color: #EA4158; font-size: 13px;'>If you did not make this change, please contact support immediately at support@groomishnow.com.</p>"
                + "<p style='margin-top: 24px; font-size: 13px;'>Best regards,<br><strong style='color: #373A43;'>Groomish Now Security Team</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendReferralBonusEmail(String to, String referrerName, String referredFriendName, int pointsEarned, int totalPointsBalance) {
        String subject = pointsEarned + " Points Added to Your Wallet - " + referredFriendName + " joined using your invite code - Groomish Now";

        String body = "<div style='color: #373A43;'>"
                + "<h2 style='color: #FC6957; margin-top: 0; font-size: 22px; font-weight: 800;'>+" + pointsEarned + " Points Added to Your Wallet! 🎁</h2>"
                + "<p>Dear <strong>" + referrerName + "</strong>,</p>"
                + "<p>Exciting news! Your friend <strong style='color: #FC6957;'>" + referredFriendName + "</strong> just registered for Groomish Now using your unique referral invite code.</p>"
                + "<p>As a thank you for expanding our salon community, we have credited <strong>" + pointsEarned + " VIP Reward Points</strong> directly to your account wallet!</p>"
                + "<div style='background: #FAF6ED; border: 1px solid rgba(55,58,67,0.12); border-radius: 14px; padding: 20px; margin: 24px 0;'>"
                + "<table style='width: 100%; border-collapse: collapse;'>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'>"
                + "<td style='padding: 10px 0; color: #7A7E89; font-size: 13px; font-weight: 600;'>Points Credited:</td>"
                + "<td style='padding: 10px 0; color: #34A955; font-size: 16px; font-weight: 800; text-align: right;'>+" + pointsEarned + " pts</td>"
                + "</tr>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'>"
                + "<td style='padding: 10px 0; color: #7A7E89; font-size: 13px; font-weight: 600;'>Referred to (Friend):</td>"
                + "<td style='padding: 10px 0; color: #373A43; font-size: 14px; font-weight: 700; text-align: right;'>" + referredFriendName + "</td>"
                + "</tr>"
                + "<tr>"
                + "<td style='padding: 10px 0; color: #7A7E89; font-size: 13px; font-weight: 600;'>Total Available Balance:</td>"
                + "<td style='padding: 10px 0; color: #FC6957; font-size: 18px; font-weight: 800; text-align: right;'>" + totalPointsBalance + " pts</td>"
                + "</tr>"
                + "</table>"
                + "</div>"
                + "<div style='background: #FFFFFF; border-left: 4px solid #FC6957; padding: 16px 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);'>"
                + "<h4 style='margin: 0 0 10px 0; color: #373A43; font-size: 14px; font-weight: 700;'>How You Can Use Your Points:</h4>"
                + "<ul style='margin: 0; padding-left: 20px; color: #555A64; font-size: 13px; line-height: 1.6;'>"
                + "<li><strong>Redeem Salon Perks:</strong> Head to the <em>Rewards</em> section to exchange your points for complimentary treatments, hair spa vouchers, and discounts.</li>"
                + "<li><strong>Service Billing Deductions:</strong> Apply your points at checkout for haircuts, beard trims, facials, and grooming at any Groomish branch.</li>"
                + "<li><strong>Lifetime VIP Tiers:</strong> Your points also count towards ascending to Gold, Platinum, and Diamond VIP tiers with higher bonus multipliers!</li>"
                + "<li><strong>Invite More Friends:</strong> There is no limit! Continue sharing your referral code with friends and family to earn 10 points on each new registration.</li>"
                + "</ul>"
                + "</div>"
                + "<div style='text-align: center; margin: 28px 0 20px 0;'>"
                + "<a href='https://groomishnow.com/customer/rewards' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(252, 105, 87, 0.35);'>View Your Points & Rewards</a>"
                + "</div>"
                + "<p style='margin-top: 24px; font-size: 13px; color: #7A7E89;'>Thank you for choosing Groomish Now!<br><strong style='color: #373A43;'>The Groomish Now Team</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendPaymentBillEmail(
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
    ) {
        String formattedDate = completedAt != null ? completedAt.format(INVOICE_DATE_FORMATTER) : LocalDateTime.now().format(INVOICE_DATE_FORMATTER);
        String invNum = invoiceNumber != null && !invoiceNumber.isBlank() ? invoiceNumber : "INV-GROOMISH-" + System.currentTimeMillis() % 100000;
        String displayRef = bookingId != null && !bookingId.isBlank() ? bookingId : invNum;
        String subject = "Tax Invoice & Payment Receipt: " + displayRef + " - Groomish Now";

        StringBuilder itemsTable = new StringBuilder();
        if (items != null && !items.isEmpty()) {
            for (BillItemDto item : items) {
                String typeBadge = "PRODUCT".equalsIgnoreCase(item.getType())
                        ? "<span style='background:#FAF6ED; color:#FA7B47; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; text-transform:uppercase;'>Store Product</span>"
                        : "<span style='background:#FAF6ED; color:#207FBD; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; text-transform:uppercase;'>Salon Service</span>";

                itemsTable.append("<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'>")
                        .append("<td style='padding: 10px 12px; color: #373A43; font-size: 13px;'>")
                        .append("<div style='font-weight: 700;'>").append(item.getName()).append("</div>")
                        .append("<div style='margin-top: 2px;'>").append(typeBadge).append("</div>")
                        .append("</td>")
                        .append("<td style='padding: 10px 12px; text-align: center; color: #7A7E89; font-size: 13px;'>").append(item.getQuantity() != null ? item.getQuantity() : 1).append("</td>")
                        .append("<td style='padding: 10px 12px; text-align: right; color: #7A7E89; font-size: 13px;'>₹").append(String.format("%.2f", item.getUnitPrice() != null ? item.getUnitPrice() : 0.0)).append("</td>")
                        .append("<td style='padding: 10px 12px; text-align: right; color: #373A43; font-weight: 700; font-size: 13px;'>₹").append(String.format("%.2f", item.getTotalPrice() != null ? item.getTotalPrice() : 0.0)).append("</td>")
                        .append("</tr>");
            }
        } else {
            itemsTable.append("<tr><td colspan='4' style='padding: 12px; text-align: center; color: #7A7E89;'>Salon Service Treatment</td></tr>");
        }

        String body = "<div style='color: #373A43;'>"
                + "<div style='display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FAF6ED; padding-bottom: 14px; margin-bottom: 20px;'>"
                + "<div>"
                + "<h2 style='color: #FC6957; margin: 0; font-size: 22px; font-weight: 800;'>Official Tax Invoice</h2>"
                + "<p style='margin: 3px 0 0 0; color: #7A7E89; font-size: 12px;'>Invoice Number: <strong>" + invNum + "</strong></p>"
                + "</div>"
                + "<div style='text-align: right;'>"
                + "<span style='display: inline-block; background: #34A955; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;'>PAID IN FULL</span>"
                + "<p style='margin: 4px 0 0 0; color: #7A7E89; font-size: 11px;'>" + formattedDate + "</p>"
                + "</div>"
                + "</div>"

                + "<p style='margin: 0 0 16px 0; font-size: 14px;'>Dear <strong>" + name + "</strong>,</p>"
                + "<p style='margin: 0 0 20px 0; font-size: 13px; color: #5D616D;'>Thank you for visiting Groomish Now. Your appointment has been marked as <strong>COMPLETED</strong>. Below is the itemized summary of your salon services and store products:</p>"

                + "<table style='width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid rgba(55,58,67,0.08); border-radius: 8px; overflow: hidden;'>"
                + "<thead>"
                + "<tr style='background: #FAF6ED; color: #373A43; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;'>"
                + "<th style='padding: 10px 12px; text-align: left;'>Item Description</th>"
                + "<th style='padding: 10px 12px; text-align: center;'>Qty</th>"
                + "<th style='padding: 10px 12px; text-align: right;'>Price</th>"
                + "<th style='padding: 10px 12px; text-align: right;'>Total</th>"
                + "</tr>"
                + "</thead>"
                + "<tbody>"
                + itemsTable
                + "</tbody>"
                + "</table>"

                + "<table style='width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;'>"
                + "<tr>"
                + "<td style='width: 55%; padding: 8px; vertical-align: top;'>"
                + "<div style='background: #FAF6ED; padding: 14px; border-radius: 10px; border: 1px solid rgba(55,58,67,0.08);'>"
                + "<p style='margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #7A7E89; text-transform: uppercase;'>Payment Method</p>"
                + "<p style='margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #373A43;'>" + (paymentMethod != null ? paymentMethod : "UPI / Card at Salon") + "</p>"
                + "<p style='margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #7A7E89; text-transform: uppercase;'>Booking Reference</p>"
                + "<p style='margin: 0; font-size: 12px; font-family: monospace; color: #373A43;'>" + (bookingId != null ? bookingId : "N/A") + "</p>"
                + "</div>"
                + "</td>"
                + "<td style='width: 45%; padding: 8px; vertical-align: top;'>"
                + "<table style='width: 100%; border-collapse: collapse; font-size: 13px;'>"
                + "<tr><td style='padding: 4px 0; color: #7A7E89;'>Subtotal:</td><td style='padding: 4px 0; text-align: right; color: #373A43; font-weight: 600;'>₹" + String.format("%.2f", subtotal != null ? subtotal : totalAmount) + "</td></tr>"
                + (discount != null && discount > 0 ? "<tr><td style='padding: 4px 0; color: #34A955;'>Discount / Promo:</td><td style='padding: 4px 0; text-align: right; color: #34A955; font-weight: 700;'>-₹" + String.format("%.2f", discount) + "</td></tr>" : "")
                + (tax != null && tax > 0 ? "<tr><td style='padding: 4px 0; color: #7A7E89;'>GST (18%):</td><td style='padding: 4px 0; text-align: right; color: #373A43;'>₹" + String.format("%.2f", tax) + "</td></tr>" : "")
                + "<tr style='border-top: 2px solid #FAF6ED;'><td style='padding: 8px 0; font-weight: 800; font-size: 15px; color: #373A43;'>Total Paid:</td><td style='padding: 8px 0; text-align: right; font-weight: 800; font-size: 17px; color: #FC6957;'>₹" + String.format("%.2f", totalAmount != null ? totalAmount : 0.0) + "</td></tr>"
                + "</table>"
                + "</td>"
                + "</tr>"
                + "</table>"

                + "<div style='background: linear-gradient(135deg, #FAF6ED 0%, #FFF8E7 100%); border: 1px solid #FED652; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;'>"
                + "<span style='font-size: 14px; font-weight: 800; color: #373A43;'>⭐ You Earned +" + (pointsEarned > 0 ? pointsEarned : Math.max(1, (int)(totalAmount / 100))) + " Groomish Loyalty Points!</span>"
                + "<p style='margin: 4px 0 0 0; font-size: 12px; color: #7A7E89;'>Points have been credited to your loyalty balance. Use them towards your next treatment or retail purchase.</p>"
                + "</div>"

                + "<div style='background: #FAF6ED; border: 1px dashed #FC6957; border-radius: 14px; padding: 22px; margin: 24px 0; text-align: center;'>"
                + "<h3 style='margin: 0 0 6px 0; font-size: 16px; color: #373A43; font-weight: 800;'>How was your experience today?</h3>"
                + "<p style='margin: 0 0 16px 0; font-size: 13px; color: #7A7E89;'>Your honest feedback helps us reward our stylists and curate top products.</p>"
                + "<a href='" + frontendUrl + "/customer/bookings/" + bookingId + "?review=true' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(252, 105, 87, 0.35);'>⭐ Please Review Your Experience</a>"
                + "<p style='margin: 10px 0 0 0; font-size: 11px; color: #7A7E89;'>Rate each service and purchased product individually in your booking details.</p>"
                + "</div>"

                + "<p style='margin-top: 24px; font-size: 13px;'>Warmest regards,<br><strong style='color: #373A43;'>Groomish Now Salon & Spa</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }
}
