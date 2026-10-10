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

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEEE, MMM dd, yyyy 'at' hh:mm a");
    private static final DateTimeFormatter INVOICE_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    @Override
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            log.info("Sending real-time Groomish Now email to: {}, Subject: {}", to, subject);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "Groomish Now");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Groomish Now email successfully sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send Groomish Now email to {}: {}", to, e.getMessage());
        }
    }

    @Override
    @Async
    public void sendWelcomeEmail(String to, String name, String referralCode) {
        String subject = "✨ Welcome to Groomish Now Loyalty Club!";
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
        String subject = "📅 Appointment Confirmed: " + serviceName + " at Groomish Now";

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
        String subject = "🔔 Appointment Update: " + status + " (" + serviceName + ")";
        String statusColor = "CANCELLED".equalsIgnoreCase(status) ? "#EA4158" : "#207FBD";

        String body = "<div style='color: #373A43;'>"
                + "<h2 style='color: " + statusColor + "; margin-top: 0; font-size: 20px;'>Appointment Update: " + status + "</h2>"
                + "<p>Dear " + name + ",</p>"
                + "<p>This is to inform you that your booking status for <strong>" + serviceName + "</strong> (Ref: " + bookingId + ") has been updated to <strong style='color: " + statusColor + ";'>" + status + "</strong>.</p>"
                + (note != null && !note.isBlank() ? "<p style='background: #FAF6ED; padding: 14px; border-left: 4px solid " + statusColor + "; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #373A43;'>" + note + "</p>" : "")
                + "<p style='color: #7A7E89; font-size: 13px;'>If you have any questions or require assistance, please contact our salon desk.</p>"
                + "<p style='margin-top: 24px; font-size: 13px;'>Warm regards,<br><strong style='color: #373A43;'>Groomish Now Team</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendRewardRedeemedEmail(String to, String name, String rewardTitle, int pointsSpent, int remainingPoints) {
        String subject = "🎁 Perk Redeemed: " + rewardTitle;

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
        String subject = "🔒 Security Alert: Your Password Was Changed";

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
        String subject = "🧾 Tax Invoice & Payment Receipt: " + invNum + " | Groomish Now";

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

                + "<p style='font-size: 13px; color: #5D616D;'>We hope you loved your treatment! Feel free to leave a review through your account dashboard.</p>"
                + "<p style='margin-top: 24px; font-size: 13px;'>Warmest regards,<br><strong style='color: #373A43;'>Groomish Now Salon & Spa</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }
}
