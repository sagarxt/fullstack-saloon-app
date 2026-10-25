package com.groomish_now.backend.service.utils.impl;

import com.groomish_now.backend.dto.mail.BillItemDto;
import com.groomish_now.backend.dto.mail.BookingEmailDto;
import com.groomish_now.backend.service.utils.EmailService;
import com.groomish_now.backend.service.utils.EmailTemplateService;
import com.groomish_now.backend.service.utils.GmailSenderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final GmailSenderService gmailSenderService;
    private final EmailTemplateService templateService;

    @Value("${gmail.api.sender-email:testmailemployee@gmail.com}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter
            .ofPattern("EEEE, MMM dd, yyyy 'at' hh:mm a");
    private static final DateTimeFormatter INVOICE_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    @Override
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            String sanitizedSubject = sanitizeSubject(subject);
            log.info("Dispatching Groomish Now email via Gmail API to: {}, Subject: {}", to, sanitizedSubject);
            gmailSenderService.sendHtmlEmail(to, sanitizedSubject, htmlContent);
        } catch (Exception e) {
            log.error("Failed to send Groomish Now email to {}: {}", to, e.getMessage());
        }
    }

    private String sanitizeSubject(String subject) {
        if (subject == null) {
            return "";
        }
        // Remove emoji / pictographic characters, dingbats, surrogate pairs, and
        // symbols
        String cleaned = subject.replaceAll(
                "[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]|[\\u2600-\\u27BF]|[\\u2300-\\u23FF]|[\\u2B00-\\u2BFF]|[\\uFE00-\\uFE0F]|[\\u200D]",
                "");
        return cleaned.replaceAll("\\s+", " ").trim();
    }

    @Override
    @Async
    public void sendWelcomeEmail(String to, String name, String referralCode) {
        String subject = "Welcome to Groomish Now Loyalty Club - Groomish Now";
        String body = "<div style='color: #373A43; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>"
                + "<h2 style='color: #FC6957; margin-top: 0; font-size: 22px; font-weight: 800;'>Welcome to Groomish Now, "
                + name + "!</h2>"
                + "<p style='font-size: 14px; line-height: 1.6; color: #5D616D;'>We are delighted to welcome you to our luxury salon experience & exclusive loyalty club. Every salon booking you make and retail product you purchase earns you Groomish Coins redeemable for treatments, perks, and VIP upgrades.</p>"
                + "<div style='background: linear-gradient(135deg, #1A1D24 0%, #2A2E39 100%); color: #FFF; padding: 24px; border-radius: 14px; margin: 24px 0; text-align: center; border: 1px solid #FC6957; box-shadow: 0 4px 16px rgba(0,0,0,0.1);'>"
                + "<p style='margin: 0 0 6px 0; color: #FED652; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;'>Your VIP Referral Invite Code</p>"
                + "<span style='font-size: 30px; font-weight: 900; letter-spacing: 5px; color: #FFF; display: block; font-family: monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.3);'>"
                + (referralCode != null ? referralCode : "GROOM50") + "</span>"
                + "<p style='margin: 10px 0 0 0; color: #D5D8DF; font-size: 12px;'>Share this code with friends and family. When they complete their first visit, you both receive bonus Groomish Coins!</p>"
                + "</div>"
                + "<div style='text-align: center; margin: 26px 0;'>"
                + "<a href='" + frontendUrl
                + "/services' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 13px 30px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(252, 105, 87, 0.35);'>Browse Services & Book Now</a>"
                + "</div>"
                + "<p style='margin-top: 24px; font-size: 13px; color: #7A7E89;'>Warm regards,<br><strong style='color: #373A43;'>The Groomish Now Team</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendBookingConfirmationEmail(BookingEmailDto dto) {
        if (dto == null || dto.getCustomerEmail() == null || dto.getCustomerEmail().isBlank())
            return;

        String subject = "Booking Confirmed: " + dto.getBookingCode() + " - Groomish Now";
        String formattedDate = dto.getScheduledAt() != null ? dto.getScheduledAt().format(DATE_FORMATTER)
                : "Scheduled Soon";

        StringBuilder sb = new StringBuilder();
        sb.append(
                "<div style='color: #373A43; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>")
                .append("<div style='display: inline-block; padding: 5px 12px; background: #E8F5E9; color: #2E7D32; font-size: 11px; font-weight: 800; border-radius: 20px; border: 1px solid #C8E6C9; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;'>Confirmed Booking</div>")
                .append("<h2 style='color: #FC6957; margin-top: 0; font-size: 22px; font-weight: 800;'>Your Booking is Confirmed!</h2>")
                .append("<p style='font-size: 14px;'>Dear <strong>").append(dto.getCustomerName())
                .append("</strong>,</p>")
                .append("<p style='font-size: 13px; color: #5D616D; line-height: 1.6;'>Thank you for booking with Groomish Now. Your salon booking has been confirmed with our certified styling specialists. Below are your booking and payment details:</p>")

                // Booking Details Card
                .append(renderBookingDetailsCard(dto.getBookingCode(), formattedDate, dto.getStoreName(),
                        dto.getStoreAddress(), dto.getStorePhone(), dto.getStoreDirectionsUrl()))

                // Itemized Table
                .append("<h3 style='font-size: 15px; font-weight: 800; color: #373A43; margin: 24px 0 10px 0;'>Booked Treatments & Products</h3>")
                .append(renderItemsTable(dto.getItems()))

                // Bill Summary
                .append("<div style='margin-top: 20px;'>")
                .append(renderBillSummary(dto))
                .append("</div>")

                // Helpful Tips & Actions
                .append("<div style='background: #FAF6ED; border: 1px solid rgba(55,58,67,0.08); border-radius: 12px; padding: 16px; margin: 24px 0;'>")
                .append("<p style='margin: 0; font-size: 12px; color: #5D616D; line-height: 1.6;'>")
                .append("<strong>Salon Arrival Tip:</strong> Please arrive 5 to 10 minutes prior to your scheduled time so our styling team can prepare your consultation. If you need to make changes or reschedule, you can manage your booking anytime in your customer account.")
                .append("</p>")
                .append("</div>")

                .append("<div style='text-align: center; margin: 26px 0 16px 0;'>")
                .append("<a href='").append(frontendUrl).append("/customer/bookings/").append(dto.getBookingId())
                .append("' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 13px 30px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(252, 105, 87, 0.35); margin-right: 10px;'>View Booking Details</a>")
                .append("<a href='").append(dto.getStoreDirectionsUrl())
                .append("' style='background: #373A43; color: #FFFFFF; text-decoration: none; padding: 13px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;'>🧭 Get Directions</a>")
                .append("</div>")

                .append("<p style='margin-top: 28px; font-size: 13px; color: #7A7E89;'>Looking forward to serving you,<br><strong style='color: #373A43;'>Groomish Now</strong></p>")
                .append("</div>");

        String fullHtml = templateService.buildTemplate(subject, sb.toString());
        sendHtmlEmail(dto.getCustomerEmail(), subject, fullHtml);
    }

    @Override
    @Async
    public void sendBookingConfirmationEmail(String to, String name, String bookingId, String serviceName,
            LocalDateTime scheduledAt, Double pricePaid) {
        BillItemDto item = BillItemDto.builder()
                .name(serviceName != null ? serviceName : "Salon Service")
                .type("SERVICE")
                .quantity(1)
                .unitPrice(pricePaid != null ? pricePaid : 0.0)
                .totalPrice(pricePaid != null ? pricePaid : 0.0)
                .image("https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop")
                .build();

        BookingEmailDto dto = BookingEmailDto.builder()
                .bookingId(bookingId)
                .bookingCode(bookingId)
                .customerName(name)
                .customerEmail(to)
                .scheduledAt(scheduledAt)
                .storeName("Groomish Now Flagship")
                .storeAddress("Indira Nagar, Bangalore")
                .storePhone("+91 98765 43210")
                .storeDirectionsUrl("https://www.google.com/maps/search/?api=1&query=Groomish+Now+Salon")
                .items(List.of(item))
                .totalMrp(pricePaid != null ? pricePaid : 0.0)
                .pricePaid(pricePaid != null ? pricePaid : 0.0)
                .discountAmount(0.0)
                .promoCode(null)
                .paymentMethod("Pay at Salon")
                .paymentStatus("PENDING")
                .status("CONFIRMED")
                .build();

        sendBookingConfirmationEmail(dto);
    }

    @Override
    @Async
    public void sendBookingStartingSoonEmail(BookingEmailDto dto) {
        if (dto == null || dto.getCustomerEmail() == null || dto.getCustomerEmail().isBlank())
            return;

        String subject = "Booking Reminder: Your booking starts in 30 minutes! - Groomish Now";
        String formattedDate = dto.getScheduledAt() != null ? dto.getScheduledAt().format(DATE_FORMATTER)
                : "In 30 minutes";

        StringBuilder sb = new StringBuilder();
        sb.append(
                "<div style='color: #373A43; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>")
                .append("<div style='background: linear-gradient(135deg, #FFF8E7 0%, #FAF6ED 100%); border-left: 4px solid #FED652; border: 1px solid #FED652; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;'>")
                .append("<div style='display: flex; align-items: center; gap: 8px;'>")
                .append("<span style='font-size: 20px;'>⏰</span>")
                .append("<h2 style='color: #373A43; margin: 0; font-size: 18px; font-weight: 800;'>Your booking will start in 30 minutes!</h2>")
                .append("</div>")
                .append("<p style='margin: 6px 0 0 0; font-size: 13px; color: #7A7E89;'>Our certified stylists are ready and prepping your station at Groomish Now.</p>")
                .append("</div>")

                .append("<p style='font-size: 14px;'>Dear <strong>").append(dto.getCustomerName())
                .append("</strong>,</p>")
                .append("<p style='font-size: 13px; color: #5D616D; line-height: 1.6;'>This is a friendly reminder that your salon booking is starting shortly:</p>")

                // Details Card
                .append(renderBookingDetailsCard(dto.getBookingCode(), formattedDate, dto.getStoreName(),
                        dto.getStoreAddress(), dto.getStorePhone(), dto.getStoreDirectionsUrl()))

                // Itemized Table
                .append("<h3 style='font-size: 15px; font-weight: 800; color: #373A43; margin: 24px 0 10px 0;'>Booked Treatments</h3>")
                .append(renderItemsTable(dto.getItems()))

                // Action Buttons: Reschedule & Directions
                .append("<div style='text-align: center; margin: 28px 0 16px 0;'>")
                .append("<a href='").append(dto.getStoreDirectionsUrl())
                .append("' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 13px 26px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(252, 105, 87, 0.35); margin-right: 10px;'>🧭 Get Directions</a>")
                .append("<a href='").append(frontendUrl).append("/customer/bookings/").append(dto.getBookingId())
                .append("?reschedule=true' style='background: #FAF6ED; color: #373A43; border: 1px solid rgba(55,58,67,0.2); text-decoration: none; padding: 13px 22px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;'>🔄 Reschedule Booking</a>")
                .append("</div>")

                .append("<p style='font-size: 12px; color: #7A7E89; text-align: center; margin-top: 12px;'>Running late? Please call our salon desk directly at <a href='tel:")
                .append(dto.getStorePhone()).append("' style='color: #FC6957; font-weight: 700;'>")
                .append(dto.getStorePhone()).append("</a>.</p>")

                .append("<p style='margin-top: 28px; font-size: 13px; color: #7A7E89;'>See you soon,<br><strong style='color: #373A43;'>Groomish Now Salon Team</strong></p>")
                .append("</div>");

        String fullHtml = templateService.buildTemplate(subject, sb.toString());
        sendHtmlEmail(dto.getCustomerEmail(), subject, fullHtml);
    }

    @Override
    @Async
    public void sendBookingModifiedEmail(BookingEmailDto dto, boolean isAdminOverride) {
        if (dto == null || dto.getCustomerEmail() == null || dto.getCustomerEmail().isBlank())
            return;

        String subject = "Booking Modified: " + dto.getBookingCode() + " - Groomish Now";
        String formattedDate = dto.getScheduledAt() != null ? dto.getScheduledAt().format(DATE_FORMATTER)
                : "Updated Schedule";

        StringBuilder sb = new StringBuilder();
        sb.append(
                "<div style='color: #373A43; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>");

        if (isAdminOverride) {
            sb.append(
                    "<div style='display: inline-block; padding: 5px 12px; background: #FFF3CD; color: #856404; font-size: 11px; font-weight: 800; border-radius: 20px; border: 1px solid #FFEEBA; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;'>Admin Notice</div>")
                    .append("<h2 style='color: #FC6957; margin-top: 0; font-size: 22px; font-weight: 800;'>Your Booking Has Been Modified</h2>")
                    .append("<p style='font-size: 14px;'>Dear <strong>").append(dto.getCustomerName())
                    .append("</strong>,</p>")
                    .append("<p style='font-size: 13px; color: #5D616D; line-height: 1.6;'>Please be informed that an administrator has updated your salon booking details at Groomish Now:</p>");
        } else {
            sb.append(
                    "<div style='display: inline-block; padding: 5px 12px; background: #E0F2FE; color: #0369A1; font-size: 11px; font-weight: 800; border-radius: 20px; border: 1px solid #BAE6FD; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;'>Booking Updated</div>")
                    .append("<h2 style='color: #FC6957; margin-top: 0; font-size: 22px; font-weight: 800;'>Your Booking Has Been Successfully Modified</h2>")
                    .append("<p style='font-size: 14px;'>Dear <strong>").append(dto.getCustomerName())
                    .append("</strong>,</p>")
                    .append("<p style='font-size: 13px; color: #5D616D; line-height: 1.6;'>Your salon booking has been updated with your new schedule and service choices:</p>");
        }

        // Details Card
        sb.append(renderBookingDetailsCard(dto.getBookingCode(), formattedDate, dto.getStoreName(),
                dto.getStoreAddress(), dto.getStorePhone(), dto.getStoreDirectionsUrl()))

                // Itemized Table
                .append("<h3 style='font-size: 15px; font-weight: 800; color: #373A43; margin: 24px 0 10px 0;'>Updated Treatments & Products</h3>")
                .append(renderItemsTable(dto.getItems()))

                // Bill Summary
                .append("<div style='margin-top: 20px;'>")
                .append(renderBillSummary(dto))
                .append("</div>");

        if (isAdminOverride && dto.getAdminNote() != null && !dto.getAdminNote().isBlank()) {
            sb.append(
                    "<div style='background: #FFF3CD; border-left: 4px solid #856404; padding: 14px 18px; border-radius: 8px; margin: 18px 0; font-size: 13px; color: #856404;'>")
                    .append("<strong>Salon Administrator Note:</strong><br>")
                    .append(dto.getAdminNote())
                    .append("</div>");
        }

        sb.append("<div style='text-align: center; margin: 26px 0 16px 0;'>")
                .append("<a href='").append(frontendUrl).append("/customer/bookings/").append(dto.getBookingId())
                .append("' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 13px 30px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(252, 105, 87, 0.35); margin-right: 10px;'>View Updated Booking</a>")
                .append("<a href='").append(dto.getStoreDirectionsUrl())
                .append("' style='background: #373A43; color: #FFFFFF; text-decoration: none; padding: 13px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;'>🧭 Get Directions</a>")
                .append("</div>")

                .append("<p style='margin-top: 28px; font-size: 13px; color: #7A7E89;'>Warm regards,<br><strong style='color: #373A43;'>Groomish Now Salon Team</strong></p>")
                .append("</div>");

        String fullHtml = templateService.buildTemplate(subject, sb.toString());
        sendHtmlEmail(dto.getCustomerEmail(), subject, fullHtml);
    }

    @Override
    @Async
    public void sendBookingAttentionRequiredEmail(BookingEmailDto dto) {
        if (dto == null || dto.getCustomerEmail() == null || dto.getCustomerEmail().isBlank())
            return;

        String subject = "Attention Required: Missed Check-in for Booking " + dto.getBookingCode() + " - Groomish Now";
        String bookedDateStr = dto.getScheduledAt() != null ? dto.getScheduledAt().format(DATE_FORMATTER)
                : "Scheduled slot";
        String cutoffTimeStr = dto.getAutoCancelCutoffTime() != null
                ? dto.getAutoCancelCutoffTime().format(DateTimeFormatter.ofPattern("hh:mm a"))
                : (dto.getScheduledAt() != null
                        ? dto.getScheduledAt().plusHours(2).format(DateTimeFormatter.ofPattern("hh:mm a"))
                        : "2 hours after scheduled time");

        StringBuilder sb = new StringBuilder();
        sb.append(
                "<div style='color: #373A43; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>")
                .append("<div style='background: #FEF2F2; border: 1px solid #FCA5A5; border-left: 5px solid #EA4158; border-radius: 12px; padding: 20px; margin-bottom: 22px;'>")
                .append("<div style='display: flex; align-items: center; gap: 8px;'>")
                .append("<span style='font-size: 22px;'>⚠️</span>")
                .append("<h2 style='color: #EA4158; margin: 0; font-size: 18px; font-weight: 800;'>Action Required: Missed Salon Check-In</h2>")
                .append("</div>")
                .append("<p style='margin: 8px 0 0 0; font-size: 13px; color: #991B1B; line-height: 1.6;'>")
                .append("We noticed that you have not checked in for your scheduled salon booking at <strong>")
                .append(bookedDateStr).append("</strong>. ")
                .append("If you do not visit the salon by <strong style='text-decoration: underline;'>")
                .append(cutoffTimeStr)
                .append("</strong> (within 2 hours of your booking time), your booking will be <strong>automatically cancelled</strong> to release the stylist's schedule.")
                .append("</p>")
                .append("</div>")

                .append("<p style='font-size: 14px;'>Dear <strong>").append(dto.getCustomerName())
                .append("</strong>,</p>")
                .append("<p style='font-size: 13px; color: #5D616D; line-height: 1.6;'>")
                .append("We understand plans can change unexpectedly. If you cannot make it right now, please reschedule your booking to another convenient slot or reach out to our salon reception directly.")
                .append("</p>")

                // Details Card
                .append(renderBookingDetailsCard(dto.getBookingCode(), bookedDateStr, dto.getStoreName(),
                        dto.getStoreAddress(), dto.getStorePhone(), dto.getStoreDirectionsUrl()))

                // Itemized Table
                .append("<h3 style='font-size: 15px; font-weight: 800; color: #373A43; margin: 24px 0 10px 0;'>Booked Treatments</h3>")
                .append(renderItemsTable(dto.getItems()))

                // CTAs: Reschedule or Call Salon
                .append("<div style='text-align: center; margin: 28px 0 16px 0;'>")
                .append("<a href='").append(frontendUrl).append("/customer/bookings/").append(dto.getBookingId())
                .append("?reschedule=true' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(252, 105, 87, 0.35); margin-right: 10px;'>🔄 Reschedule Booking Now</a>")
                .append("<a href='tel:").append(dto.getStorePhone())
                .append("' style='background: #111317; color: #FFFFFF; text-decoration: none; padding: 13px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;'>📞 Call Salon for Help</a>")
                .append("</div>")

                .append("<p style='font-size: 12px; color: #7A7E89; text-align: center; margin-top: 12px;'>Salon Reception Desk: <a href='tel:")
                .append(dto.getStorePhone()).append("' style='color: #FC6957; font-weight: 700;'>")
                .append(dto.getStorePhone()).append("</a></p>")

                .append("<p style='margin-top: 28px; font-size: 13px; color: #7A7E89;'>Warm regards,<br><strong style='color: #373A43;'>Groomish Now Salon Team</strong></p>")
                .append("</div>");

        String fullHtml = templateService.buildTemplate(subject, sb.toString());
        sendHtmlEmail(dto.getCustomerEmail(), subject, fullHtml);
    }

    @Override
    @Async
    public void sendBookingCompletedEmail(BookingEmailDto dto) {
        if (dto == null || dto.getCustomerEmail() == null || dto.getCustomerEmail().isBlank())
            return;

        String subject = "Booking Completed & Tax Invoice: " + dto.getBookingCode() + " - Groomish Now";
        String completedDate = LocalDateTime.now().format(INVOICE_DATE_FORMATTER);

        StringBuilder sb = new StringBuilder();
        sb.append(
                "<div style='color: #373A43; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>")
                .append("<div style='display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FAF6ED; padding-bottom: 14px; margin-bottom: 20px;'>")
                .append("<div>")
                .append("<h2 style='color: #FC6957; margin: 0; font-size: 22px; font-weight: 800;'>Official Tax Invoice & Receipt</h2>")
                .append("<p style='margin: 3px 0 0 0; color: #7A7E89; font-size: 12px;'>Booking Ref: <strong>")
                .append(dto.getBookingCode()).append("</strong></p>")
                .append("</div>")
                .append("<div style='text-align: right;'>")
                .append("<span style='display: inline-block; background: #34A955; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;'>PAID IN FULL</span>")
                .append("<p style='margin: 4px 0 0 0; color: #7A7E89; font-size: 11px;'>").append(completedDate)
                .append("</p>")
                .append("</div>")
                .append("</div>")

                .append("<p style='margin: 0 0 14px 0; font-size: 14px;'>Dear <strong>").append(dto.getCustomerName())
                .append("</strong>,</p>")
                .append("<p style='margin: 0 0 20px 0; font-size: 13px; color: #5D616D; line-height: 1.6;'>")
                .append("Thank you for visiting Groomish Now! Your salon booking has been marked as <strong>COMPLETED</strong>. Below is the complete itemized bill of your treatments and store products:")
                .append("</p>")

                // Itemized Table (all services and products added by staff)
                .append(renderItemsTable(dto.getItems()))

                // Bill Summary
                .append("<div style='margin-top: 20px;'>")
                .append(renderBillSummary(dto))
                .append("</div>")

                // Loyalty Coins Earned
                .append("<div style='background: linear-gradient(135deg, #FAF6ED 0%, #FFF8E7 100%); border: 1px solid #FED652; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;'>")
                .append("<span style='font-size: 14px; font-weight: 800; color: #373A43;'>⭐ You Earned +")
                .append(dto.getPointsEarned() != null ? dto.getPointsEarned()
                        : Math.max(1, (int) Math.round(dto.getPricePaid() / 100.0)))
                .append(" Groomish Loyalty Coins!</span>")
                .append("<p style='margin: 4px 0 0 0; font-size: 12px; color: #7A7E89;'>Coins have been credited to your loyalty balance. Use them towards your next treatment or retail purchase.</p>")
                .append("</div>")

                // 5-Star Rating Section
                .append(renderFiveStarsReviewBanner(dto.getBookingId()))

                .append("<p style='margin-top: 28px; font-size: 13px; color: #7A7E89;'>Warmest regards,<br><strong style='color: #373A43;'>Groomish Now</strong></p>")
                .append("</div>");

        String fullHtml = templateService.buildTemplate(subject, sb.toString());
        sendHtmlEmail(dto.getCustomerEmail(), subject, fullHtml);
    }

    @Override
    @Async
    public void sendBookingStatusEmail(String to, String name, String bookingId, String serviceName, String status,
            String note) {
        String displayCode = bookingId != null && !bookingId.isBlank() ? bookingId : "GN-UNKNOWN";
        String subject;
        if (status != null && (status.equalsIgnoreCase("CANCELLED") || status.equalsIgnoreCase("CANCELED")
                || status.equalsIgnoreCase("AUTO_CANCELLED"))) {
            subject = "Booking Canceled: " + displayCode + " - Groomish Now";
        } else if (status != null && (status.equalsIgnoreCase("MODIFIED") || status.equalsIgnoreCase("RESCHEDULED"))) {
            subject = "Booking Modified: " + displayCode + " - Groomish Now";
        } else if (status != null && status.equalsIgnoreCase("CONFIRMED")) {
            subject = "Booking Confirmed: " + displayCode + " - Groomish Now";
        } else if (status != null && status.equalsIgnoreCase("IN_PROGRESS")) {
            subject = "Booking In Progress: " + displayCode + " - Groomish Now";
        } else if (status != null && status.equalsIgnoreCase("COMPLETED")) {
            subject = "Booking Completed: " + displayCode + " - Groomish Now";
        } else {
            subject = "Booking Update: " + displayCode + " - Groomish Now";
        }

        String statusColor = ("CANCELLED".equalsIgnoreCase(status) || "CANCELED".equalsIgnoreCase(status)
                || "AUTO_CANCELLED".equalsIgnoreCase(status))
                        ? "#EA4158"
                        : ("IN_PROGRESS".equalsIgnoreCase(status) ? "#7C3AED" : "#207FBD");

        String body = "<div style='color: #373A43; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>"
                + "<h2 style='color: " + statusColor + "; margin-top: 0; font-size: 20px;'>Booking Update: " + status
                + "</h2>"
                + "<p>Dear " + name + ",</p>"
                + "<p>This is to inform you that your booking status for <strong>" + serviceName + "</strong> (Ref: "
                + displayCode + ") has been updated to <strong style='color: " + statusColor + ";'>" + status
                + "</strong>.</p>"
                + (note != null && !note.isBlank()
                        ? "<p style='background: #FAF6ED; padding: 14px; border-left: 4px solid " + statusColor
                                + "; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #373A43;'>" + note
                                + "</p>"
                        : "")
                + ("COMPLETED".equalsIgnoreCase(status) ? renderFiveStarsReviewBanner(bookingId) : "")
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
            String adminNote) {
        BillItemDto item = BillItemDto.builder()
                .name(serviceName != null ? serviceName : "Salon Service")
                .type("SERVICE")
                .quantity(1)
                .unitPrice(pricePaid != null ? pricePaid : 0.0)
                .totalPrice(pricePaid != null ? pricePaid : 0.0)
                .image("https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop")
                .build();

        BookingEmailDto dto = BookingEmailDto.builder()
                .bookingId(bookingId)
                .bookingCode(bookingCode != null && !bookingCode.isBlank() ? bookingCode : bookingId)
                .customerName(name)
                .customerEmail(to)
                .scheduledAt(scheduledAt)
                .storeName(storeName != null && !storeName.isBlank() ? storeName : "Groomish Now Flagship")
                .storeAddress("Indira Nagar, Bangalore")
                .storePhone("+91 98765 43210")
                .storeDirectionsUrl("https://www.google.com/maps/search/?api=1&query=Groomish+Now+Salon")
                .items(List.of(item))
                .totalMrp(pricePaid != null ? pricePaid : 0.0)
                .pricePaid(pricePaid != null ? pricePaid : 0.0)
                .discountAmount(0.0)
                .promoCode(null)
                .paymentMethod(paymentMethod != null ? paymentMethod : "CASH")
                .paymentStatus(paymentStatus != null ? paymentStatus : "PENDING")
                .status(status != null ? status : "MODIFIED")
                .adminNote(adminNote)
                .build();

        sendBookingModifiedEmail(dto, true);
    }

    @Override
    @Async
    public void sendRewardRedeemedEmail(String to, String name, String rewardTitle, int pointsSpent,
            int remainingPoints) {
        String subject = "Perk Redeemed: " + rewardTitle + " - Groomish Now";

        String body = "<div style='color: #373A43; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>"
                + "<h2 style='color: #FC6957; margin-top: 0; font-size: 20px;'>Congratulations on Your Reward!</h2>"
                + "<p>Dear " + name + ",</p>"
                + "<p>You have successfully redeemed <strong>" + rewardTitle
                + "</strong> using your Groomish loyalty points.</p>"
                + "<div style='background: #FAF6ED; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid rgba(55,58,67,0.1);'>"
                + "<p style='margin: 4px 0; font-size: 13px;'><strong>Points Redeemed:</strong> <span style='color: #EA4158; font-weight: 700;'>-"
                + pointsSpent + " pts</span></p>"
                + "<p style='margin: 4px 0; font-size: 13px;'><strong>Remaining Points Balance:</strong> <span style='color: #34A955; font-weight: 700;'>"
                + remainingPoints + " pts</span></p>"
                + "</div>"
                + "<p style='font-size: 13px; color: #7A7E89;'>Present this confirmation code at your next salon visit to claim your perk.</p>"
                + "<p style='margin-top: 24px; font-size: 13px;'>Cheers,<br><strong style='color: #373A43;'>Groomish Now Loyalty Team</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendVoucherClaimedEmail(
            String to,
            String name,
            String voucherCode,
            String title,
            String description,
            Integer discountPercent,
            LocalDateTime expiresAt,
            String eligibleDetails) {
        String subject = "Your Voucher is Ready: " + voucherCode + " - Groomish Now";
        String expiryStr = expiresAt != null ? expiresAt.format(DateTimeFormatter.ofPattern("EEEE, MMM dd, yyyy"))
                : "30 days from issuance";

        StringBuilder sb = new StringBuilder();
        sb.append(
                "<div style='color: #373A43; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>")
                .append("<div style='display: inline-block; padding: 5px 12px; background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 800; border-radius: 20px; border: 1px solid #FDE68A; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;'>Exclusive Voucher</div>")
                .append("<h2 style='color: #FC6957; margin-top: 0; font-size: 22px; font-weight: 800;'>Your Salon Voucher is Ready! 🎁</h2>")
                .append("<p style='font-size: 14px;'>Dear <strong>").append(name != null ? name : "Valued Member")
                .append("</strong>,</p>")
                .append("<p style='font-size: 13px; color: #5D616D; line-height: 1.6;'>")
                .append("Congratulations on claiming your exclusive Groomish Now salon voucher. Your voucher has been activated and is ready to redeem on your next salon visit or online booking checkout:")
                .append("</p>")

                // Luxury Gift Card Box
                .append("<div style='background: linear-gradient(135deg, #111317 0%, #1F242E 100%); border-radius: 16px; padding: 26px 22px; margin: 24px 0; border: 1px solid #FC6957; box-shadow: 0 8px 24px rgba(0,0,0,0.12); text-align: center; color: #ffffff;'>")
                .append("<p style='margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #FED652; text-transform: uppercase; letter-spacing: 2px;'>Groomish Now Voucher</p>")
                .append("<h3 style='margin: 0 0 14px 0; font-size: 20px; font-weight: 800; color: #ffffff;'>")
                .append(title != null ? title : "VIP Salon Perk").append("</h3>")
                .append("<div style='background: rgba(255,255,255,0.08); border: 2px dashed #FED652; border-radius: 12px; padding: 14px; margin: 0 auto 16px auto; max-width: 280px;'>")
                .append("<span style='font-size: 24px; font-weight: 900; letter-spacing: 5px; color: #FED652; font-family: monospace; display: block;'>")
                .append(voucherCode).append("</span>")
                .append("</div>")
                .append("<div style='display: flex; justify-content: center; gap: 16px; font-size: 12px; color: #D5D8DF; flex-wrap: wrap;'>")
                .append("<span>🏷️ Benefit: <strong style='color:#fff;'>")
                .append(discountPercent != null ? discountPercent + "% OFF" : "Exclusive Discount")
                .append("</strong></span>")
                .append("<span>⏳ Valid Until: <strong style='color:#fff;'>").append(expiryStr)
                .append("</strong></span>")
                .append("</div>")
                .append("</div>")

                // Eligible details box
                .append("<div style='background: #FAF6ED; border: 1px solid rgba(55,58,67,0.08); border-radius: 12px; padding: 18px; margin: 20px 0;'>")
                .append("<h4 style='margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #373A43; text-transform: uppercase; letter-spacing: 0.5px;'>Voucher Terms & Eligible Treatments:</h4>")
                .append("<p style='margin: 0 0 6px 0; font-size: 13px; color: #5D616D;'>")
                .append("<strong>Eligible Services / Products:</strong> ")
                .append(eligibleDetails != null && !eligibleDetails.isBlank() ? eligibleDetails
                        : "All Salon Services & Treatments")
                .append("</p>")
                .append(description != null && !description.isBlank()
                        ? "<p style='margin: 0; font-size: 12px; color: #7A7E89; line-height: 1.5;'>" + description
                                + "</p>"
                        : "")
                .append("</div>")

                .append("<div style='text-align: center; margin: 28px 0 16px 0;'>")
                .append("<a href='").append(frontendUrl)
                .append("/services' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(252, 105, 87, 0.35);'>Browse Services & Book Now</a>")
                .append("</div>")

                .append("<p style='margin-top: 28px; font-size: 13px; color: #7A7E89;'>Enjoy your salon pampering,<br><strong style='color: #373A43;'>Groomish Now Loyalty Team</strong></p>")
                .append("</div>");

        String fullHtml = templateService.buildTemplate(subject, sb.toString());
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendPasswordChangedEmail(String to, String name) {
        String subject = "Security Alert: Your Password Was Changed - Groomish Now";

        String body = "<div style='color: #373A43; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>"
                + "<h2 style='color: #373A43; margin-top: 0; font-size: 20px;'>Security Notification</h2>"
                + "<p>Hello " + name + ",</p>"
                + "<p>Your password for Groomish Now was successfully updated on "
                + LocalDateTime.now().format(DATE_FORMATTER) + ".</p>"
                + "<p style='color: #EA4158; font-size: 13px;'>If you did not make this change, please contact support immediately at support@groomishnow.com.</p>"
                + "<p style='margin-top: 24px; font-size: 13px;'>Best regards,<br><strong style='color: #373A43;'>Groomish Now Security Team</strong></p>"
                + "</div>";

        String fullHtml = templateService.buildTemplate(subject, body);
        sendHtmlEmail(to, subject, fullHtml);
    }

    @Override
    @Async
    public void sendReferralBonusEmail(String to, String referrerName, String referredFriendName, int pointsEarned,
            int totalPointsBalance) {
        String subject = pointsEarned + " Points Added to Your Wallet - " + referredFriendName
                + " joined using your invite code - Groomish Now";

        String body = "<div style='color: #373A43; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>"
                + "<h2 style='color: #FC6957; margin-top: 0; font-size: 22px; font-weight: 800;'>+" + pointsEarned
                + " Points Added to Your Wallet! 🎁</h2>"
                + "<p>Dear <strong>" + referrerName + "</strong>,</p>"
                + "<p>Exciting news! Your friend <strong style='color: #FC6957;'>" + referredFriendName
                + "</strong> just registered for Groomish Now using your unique referral invite code.</p>"
                + "<p>As a thank you for expanding our salon community, we have credited <strong>" + pointsEarned
                + " VIP Reward Points</strong> directly to your account wallet!</p>"
                + "<div style='background: #FAF6ED; border: 1px solid rgba(55,58,67,0.12); border-radius: 14px; padding: 20px; margin: 24px 0;'>"
                + "<table style='width: 100%; border-collapse: collapse;'>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'>"
                + "<td style='padding: 10px 0; color: #7A7E89; font-size: 13px; font-weight: 600;'>Points Credited:</td>"
                + "<td style='padding: 10px 0; color: #34A955; font-size: 16px; font-weight: 800; text-align: right;'>+"
                + pointsEarned + " pts</td>"
                + "</tr>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.08);'>"
                + "<td style='padding: 10px 0; color: #7A7E89; font-size: 13px; font-weight: 600;'>Referred to (Friend):</td>"
                + "<td style='padding: 10px 0; color: #373A43; font-size: 14px; font-weight: 700; text-align: right;'>"
                + referredFriendName + "</td>"
                + "</tr>"
                + "<tr>"
                + "<td style='padding: 10px 0; color: #7A7E89; font-size: 13px; font-weight: 600;'>Total Available Balance:</td>"
                + "<td style='padding: 10px 0; color: #FC6957; font-size: 18px; font-weight: 800; text-align: right;'>"
                + totalPointsBalance + " pts</td>"
                + "</tr>"
                + "</table>"
                + "</div>"
                + "<div style='text-align: center; margin: 28px 0 20px 0;'>"
                + "<a href='" + frontendUrl
                + "/customer/rewards' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(252, 105, 87, 0.35);'>View Your Points & Rewards</a>"
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
            LocalDateTime completedAt) {
        BookingEmailDto dto = BookingEmailDto.builder()
                .bookingId(bookingId)
                .bookingCode(bookingId)
                .customerName(name)
                .customerEmail(to)
                .scheduledAt(completedAt)
                .storeName("Groomish Now Flagship")
                .storeAddress("Indira Nagar, Bangalore")
                .storePhone("+91 98765 43210")
                .storeDirectionsUrl("https://www.google.com/maps/search/?api=1&query=Groomish+Now+Salon")
                .items(items)
                .totalMrp(subtotal != null ? subtotal : totalAmount)
                .pricePaid(totalAmount != null ? totalAmount : 0.0)
                .discountAmount(discount != null ? discount : 0.0)
                .promoCode(null)
                .paymentMethod(paymentMethod != null ? paymentMethod : "UPI / Card at Salon")
                .paymentStatus("COMPLETED")
                .status("COMPLETED")
                .pointsEarned(pointsEarned)
                .build();

        sendBookingCompletedEmail(dto);
    }

    // ==========================================
    // REUSABLE HTML RENDERING HELPER METHODS
    // ==========================================

    private String renderBookingDetailsCard(String bookingCode, String scheduledAt, String storeName,
            String storeAddress, String storePhone, String storeDirectionsUrl) {
        return "<table style='width: 100%; border-collapse: collapse; margin: 18px 0; background: #FAF6ED; border-radius: 14px; overflow: hidden; border: 1px solid rgba(55,58,67,0.08);'>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.06);'>"
                + "<td style='padding: 12px 16px; font-weight: 600; color: #7A7E89; width: 34%; font-size: 13px;'>Booking Reference:</td>"
                + "<td style='padding: 12px 16px; color: #373A43; font-weight: 800; font-family: monospace; font-size: 15px;'>"
                + bookingCode + "</td>"
                + "</tr>"
                + "<tr style='border-bottom: 1px solid rgba(55,58,67,0.06);'>"
                + "<td style='padding: 12px 16px; font-weight: 600; color: #7A7E89; font-size: 13px;'>Scheduled Date & Time:</td>"
                + "<td style='padding: 12px 16px; color: #FC6957; font-weight: 700; font-size: 14px;'>📅 " + scheduledAt
                + "</td>"
                + "</tr>"
                + "<tr>"
                + "<td style='padding: 12px 16px; font-weight: 600; color: #7A7E89; font-size: 13px; vertical-align: top;'>Salon Branch:</td>"
                + "<td style='padding: 12px 16px; color: #373A43; font-size: 13px;'>"
                + "<div style='font-weight: 700; font-size: 14px;'>📍 " + storeName + "</div>"
                + "<div style='color: #7A7E89; margin-top: 2px; font-size: 12px;'>" + storeAddress + "</div>"
                + (storeDirectionsUrl != null && !storeDirectionsUrl.isBlank()
                        ? "<div style='margin-top: 8px;'><a href='" + storeDirectionsUrl
                                + "' style='display: inline-block; background: #373A43; color: #FFFFFF; text-decoration: none; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 6px;'>🧭 Get Directions</a></div>"
                        : "")
                + "</td>"
                + "</tr>"
                + "</table>";
    }

    private String renderItemsTable(List<BillItemDto> items) {
        StringBuilder sb = new StringBuilder();
        sb.append(
                "<table style='width: 100%; border-collapse: collapse; margin-bottom: 18px; border: 1px solid rgba(55,58,67,0.08); border-radius: 10px; overflow: hidden;'>")
                .append("<thead>")
                .append("<tr style='background: #FAF6ED; color: #373A43; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'>")
                .append("<th style='padding: 10px 12px; text-align: left;'>Item Description</th>")
                .append("<th style='padding: 10px 12px; text-align: center; width: 50px;'>Qty</th>")
                .append("<th style='padding: 10px 12px; text-align: right; width: 95px;'>Unit Price</th>")
                .append("<th style='padding: 10px 12px; text-align: right; width: 95px;'>Total</th>")
                .append("</tr>")
                .append("</thead>")
                .append("<tbody>");

        if (items != null && !items.isEmpty()) {
            for (BillItemDto it : items) {
                String imgUrl = (it.getImage() != null && !it.getImage().isBlank())
                        ? it.getImage()
                        : ("PRODUCT".equalsIgnoreCase(it.getType())
                                ? "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop"
                                : "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop");

                String typeBadge = "PRODUCT".equalsIgnoreCase(it.getType())
                        ? "<span style='background:#FAF6ED; color:#FA7B47; font-size:9px; font-weight:700; padding:2px 6px; border-radius:4px; text-transform:uppercase;'>Product</span>"
                        : "<span style='background:#FAF6ED; color:#207FBD; font-size:9px; font-weight:700; padding:2px 6px; border-radius:4px; text-transform:uppercase;'>Service</span>";

                int qty = it.getQuantity() != null ? it.getQuantity() : 1;
                String multiplierBadge = qty > 1
                        ? " <span style='background: #FED652; color: #111317; font-size: 10px; font-weight: 800; padding: 1px 5px; border-radius: 4px; margin-left: 4px;'>x"
                                + qty + "</span>"
                        : "";

                double unitPrice = it.getUnitPrice() != null ? it.getUnitPrice() : 0.0;
                double totalPrice = it.getTotalPrice() != null ? it.getTotalPrice() : (unitPrice * qty);
                Double unitMrp = it.getUnitMrp();
                Double totalMrp = it.getTotalMrp();

                String mrpNote = (unitMrp != null && unitMrp > unitPrice)
                        ? " <span style='color: #7A7E89; font-size: 11px; margin-left: 6px;'>(MRP: <span style='text-decoration: line-through;'>₹"
                                + String.format("%.0f", unitMrp) + "</span>)</span>"
                        : "";

                sb.append("<tr style='border-bottom: 1px solid rgba(55,58,67,0.06);'>")
                        .append("<td style='padding: 10px 12px; color: #373A43;'>")
                        .append("<table cellpadding='0' cellspacing='0' style='border-collapse: collapse;'><tr>")
                        .append("<td style='vertical-align: middle; padding-right: 10px;'>")
                        .append("<img src='").append(imgUrl)
                        .append("' alt='item' style='width: 44px; height: 44px; border-radius: 8px; object-fit: cover; display: block; border: 1px solid rgba(55,58,67,0.1);' />")
                        .append("</td>")
                        .append("<td style='vertical-align: middle;'>")
                        .append("<div style='font-weight: 700; font-size: 13px; color: #373A43;'>").append(it.getName())
                        .append(multiplierBadge).append("</div>")
                        .append("<div style='margin-top: 3px;'>").append(typeBadge).append(mrpNote).append("</div>")
                        .append("</td>")
                        .append("</tr></table>")
                        .append("</td>")
                        .append("<td style='padding: 10px 12px; text-align: center; color: #7A7E89; font-size: 13px; font-weight: 600;'>")
                        .append(qty).append("</td>")
                        .append("<td style='padding: 10px 12px; text-align: right; font-size: 13px;'>");

                if (unitMrp != null && unitMrp > unitPrice) {
                    sb.append("<div style='color: #7A7E89; text-decoration: line-through; font-size: 11px;'>₹")
                            .append(String.format("%.2f", unitMrp)).append("</div>");
                }
                sb.append("<div style='color: #373A43; font-weight: 600;'>₹").append(String.format("%.2f", unitPrice))
                        .append("</div>")
                        .append("</td>")
                        .append("<td style='padding: 10px 12px; text-align: right; font-size: 13px;'>");

                if (totalMrp != null && totalMrp > totalPrice) {
                    sb.append("<div style='color: #7A7E89; text-decoration: line-through; font-size: 11px;'>₹")
                            .append(String.format("%.2f", totalMrp)).append("</div>");
                }
                sb.append("<div style='color: #FC6957; font-weight: 700;'>₹").append(String.format("%.2f", totalPrice))
                        .append("</div>")
                        .append("</td>")
                        .append("</tr>");
            }
        } else {
            sb.append(
                    "<tr><td colspan='4' style='padding: 14px; text-align: center; color: #7A7E89; font-size: 13px;'>Salon Booking Treatment</td></tr>");
        }

        sb.append("</tbody></table>");
        return sb.toString();
    }

    private String renderBillSummary(BookingEmailDto dto) {
        double subtotal = dto.getSubtotal() != null ? dto.getSubtotal()
                : (dto.getTotalMrp() != null ? dto.getTotalMrp() : 0.0);
        double paid = dto.getFinalPayable() != null ? dto.getFinalPayable()
                : (dto.getPricePaid() != null ? dto.getPricePaid() : subtotal);
        double mrpDiscount = dto.getMrpDiscount() != null && dto.getMrpDiscount() > 0 ? dto.getMrpDiscount()
                : (dto.getDiscountAmount() != null ? dto.getDiscountAmount() : 0.0);

        String couponCode = dto.getCouponCode();
        Double couponDisc = dto.getCouponDiscount();
        String voucherCode = dto.getVoucherCode();
        Double voucherDisc = dto.getVoucherDiscount();

        // Fallback if promoCode is set
        if (couponCode == null && voucherCode == null && dto.getPromoCode() != null && !dto.getPromoCode().isBlank()) {
            if (dto.getPromoCode().toUpperCase().contains("VOUCH")
                    || dto.getPromoCode().toUpperCase().contains("VIP")) {
                voucherCode = dto.getPromoCode();
                voucherDisc = Math.max(0.0, subtotal - mrpDiscount - paid);
            } else {
                couponCode = dto.getPromoCode();
                couponDisc = Math.max(0.0, subtotal - mrpDiscount - paid);
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append("<table style='width: 100%; border-collapse: collapse; font-size: 13px;'>")
                .append("<tr>")
                .append("<td style='width: 50%; padding: 8px; vertical-align: top;'>")
                .append("<div style='background: #FAF6ED; padding: 14px; border-radius: 10px; border: 1px solid rgba(55,58,67,0.08);'>")
                .append("<p style='margin: 0 0 3px 0; font-size: 11px; font-weight: 700; color: #7A7E89; text-transform: uppercase;'>Payment Mode</p>")
                .append("<p style='margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #373A43;'>")
                .append(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "Pay at Salon").append("</p>")
                .append("<p style='margin: 0 0 3px 0; font-size: 11px; font-weight: 700; color: #7A7E89; text-transform: uppercase;'>Payment Status</p>")
                .append("<p style='margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: ")
                .append("COMPLETED".equalsIgnoreCase(dto.getPaymentStatus()) ? "#2E7D32" : "#B45309").append(";'>")
                .append(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : "PENDING").append("</p>");

        if (couponCode != null && !couponCode.isBlank()) {
            sb.append(
                    "<p style='margin: 0 0 3px 0; font-size: 11px; font-weight: 700; color: #7A7E89; text-transform: uppercase;'>Coupon Applied</p>")
                    .append("<p style='margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #2E7D32; font-family: monospace;'>🏷️ ")
                    .append(couponCode).append("</p>");
        }
        if (voucherCode != null && !voucherCode.isBlank()) {
            sb.append(
                    "<p style='margin: 0 0 3px 0; font-size: 11px; font-weight: 700; color: #7A7E89; text-transform: uppercase;'>Voucher Applied</p>")
                    .append("<p style='margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #2E7D32; font-family: monospace;'>🎟️ ")
                    .append(voucherCode).append("</p>");
        }

        sb.append("</div>")
                .append("</td>")
                .append("<td style='width: 50%; padding: 8px; vertical-align: top;'>")
                .append("<table style='width: 100%; border-collapse: collapse; font-size: 13px;'>")
                .append("<tr><td style='padding: 5px 0; color: #7A7E89;'>Subtotal:</td><td style='padding: 5px 0; text-align: right; color: #373A43; font-weight: 700;'>₹")
                .append(String.format("%.2f", subtotal)).append("</td></tr>");

        if (mrpDiscount > 0) {
            sb.append(
                    "<tr><td style='padding: 5px 0; color: #2E7D32;'>Discount on MRP:</td><td style='padding: 5px 0; text-align: right; color: #2E7D32; font-weight: 700;'>-₹")
                    .append(String.format("%.2f", mrpDiscount)).append("</td></tr>");
        }

        if (couponCode != null && !couponCode.isBlank() && couponDisc != null && couponDisc > 0) {
            sb.append("<tr><td style='padding: 5px 0; color: #2E7D32;'>Coupon (").append(couponCode).append(
                    "):</td><td style='padding: 5px 0; text-align: right; color: #2E7D32; font-weight: 700;'>-₹")
                    .append(String.format("%.2f", couponDisc)).append("</td></tr>");
        }

        if (voucherCode != null && !voucherCode.isBlank() && voucherDisc != null && voucherDisc > 0) {
            sb.append("<tr><td style='padding: 5px 0; color: #2E7D32;'>Voucher (").append(voucherCode).append(
                    "):</td><td style='padding: 5px 0; text-align: right; color: #2E7D32; font-weight: 700;'>-₹")
                    .append(String.format("%.2f", voucherDisc)).append("</td></tr>");
        }

        double totalSavings = mrpDiscount + (couponDisc != null ? couponDisc : 0.0) + (voucherDisc != null ? voucherDisc : 0.0);
        if (totalSavings > 0) {
            sb.append("<tr style='background: #E8F5E9;'><td style='padding: 5px 6px; color: #2E7D32; font-weight: 700; font-size: 11px;'>Total Savings:</td><td style='padding: 5px 6px; text-align: right; color: #2E7D32; font-weight: 800; font-size: 12px;'>₹")
                    .append(String.format("%.2f", totalSavings)).append(" OFF</td></tr>");
        }

        sb.append(
                "<tr><td style='padding: 5px 0; color: #7A7E89;'>Salon Hygiene & Taxes:</td><td style='padding: 5px 0; text-align: right; color: #2E7D32; font-weight: 700; font-size: 11px;'>FREE</td></tr>")
                .append("<tr style='border-top: 2px solid #FAF6ED;'><td style='padding: 8px 0; font-weight: 800; font-size: 14px; color: #373A43;'>Final Payable:</td><td style='padding: 8px 0; text-align: right; font-weight: 800; font-size: 18px; color: #FC6957;'>₹")
                .append(String.format("%.2f", paid)).append("</td></tr>")
                .append("</table>")
                .append("</td>")
                .append("</tr>")
                .append("</table>");
        return sb.toString();
    }

    private String renderFiveStarsReviewBanner(String bookingId) {
        return "<div style='background: #FAF6ED; border: 1px dashed #FC6957; border-radius: 14px; padding: 22px; margin: 24px 0; text-align: center;'>"
                + "<div style='font-size: 26px; color: #FED652; letter-spacing: 4px; margin-bottom: 6px;'>★★★★★</div>"
                + "<h3 style='margin: 0 0 6px 0; font-size: 16px; color: #373A43; font-weight: 800;'>How was your booking today?</h3>"
                + "<p style='margin: 0 0 16px 0; font-size: 13px; color: #7A7E89;'>Your rating & honest feedback help us celebrate exceptional stylists and curate the best treatments.</p>"
                + "<a href='" + frontendUrl + "/customer/bookings/" + bookingId
                + "?review=true' style='background: #FC6957; color: #FFFFFF; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(252, 105, 87, 0.35);'>⭐ Give Feedback & Review</a>"
                + "</div>";
    }
}
