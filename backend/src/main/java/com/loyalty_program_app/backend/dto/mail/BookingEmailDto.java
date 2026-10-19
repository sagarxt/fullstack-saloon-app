package com.loyalty_program_app.backend.dto.mail;

import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.BookingItem;
import com.loyalty_program_app.backend.model.BookingProduct;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingEmailDto {

    private String bookingId;
    private String bookingCode;
    private String customerName;
    private String customerEmail;
    private LocalDateTime scheduledAt;

    private String storeName;
    private String storeAddress;
    private String storePhone;
    private String storeDirectionsUrl;

    @Builder.Default
    private List<BillItemDto> items = new ArrayList<>();

    private Double totalMrp;
    private Double pricePaid;
    private Double discountAmount;
    private String promoCode;
    private String paymentMethod;
    private String paymentStatus;

    private Double subtotal;
    private Double mrpDiscount;
    private String couponCode;
    private Double couponDiscount;
    private String voucherCode;
    private Double voucherDiscount;
    private Double finalPayable;

    private String status;
    private String note;
    private String adminNote;
    private Integer pointsEarned;
    private LocalDateTime autoCancelCutoffTime;

    public static BookingEmailDto fromBooking(Booking b) {
        if (b == null) return new BookingEmailDto();

        String code = b.getBookingCode() != null && !b.getBookingCode().isBlank()
                ? b.getBookingCode()
                : (b.getId() != null ? "GN-" + b.getId().toString().substring(0, 8).toUpperCase() : "GN-UNKNOWN");

        String name = b.getUser() != null && b.getUser().getName() != null ? b.getUser().getName() : "Valued Customer";
        String email = b.getUser() != null ? b.getUser().getEmail() : "";

        String stName = b.getStoreNameSnapshot() != null && !b.getStoreNameSnapshot().isBlank()
                ? b.getStoreNameSnapshot()
                : (b.getStore() != null ? b.getStore().getName() : "Groomish Now Flagship");

        String stAddr = b.getStoreAddressSnapshot() != null && !b.getStoreAddressSnapshot().isBlank()
                ? b.getStoreAddressSnapshot()
                : (b.getStore() != null
                    ? (b.getStore().getAddress() != null ? b.getStore().getAddress() : "")
                        + (b.getStore().getCity() != null ? ", " + b.getStore().getCity() : "")
                    : "Indira Nagar, Bangalore");

        String stPhone = b.getStore() != null && b.getStore().getPhone() != null && !b.getStore().getPhone().isBlank()
                ? b.getStore().getPhone()
                : "+91 98765 43210";

        String dirUrl;
        if (b.getStore() != null && b.getStore().getLatitude() != null && b.getStore().getLongitude() != null) {
            dirUrl = "https://www.google.com/maps/dir/?api=1&destination=" + b.getStore().getLatitude() + "," + b.getStore().getLongitude();
        } else {
            dirUrl = "https://www.google.com/maps/search/?api=1&query=" + URLEncoder.encode(stName + " " + stAddr, StandardCharsets.UTF_8);
        }

        // Group & extract items
        List<BillItemDto> billItems = new ArrayList<>();
        double calculatedMrp = 0.0;
        double baseBookingAmount = b.getTotalAmount() != null ? b.getTotalAmount() : 0.0;

        // Group services to show multipliers if same service booked multiple times
        if (b.getBookingItems() != null && !b.getBookingItems().isEmpty()) {
            Map<String, BillItemDto> serviceMap = new LinkedHashMap<>();
            for (BookingItem bi : b.getBookingItems()) {
                String sName = bi.getServiceNameSnapshot() != null ? bi.getServiceNameSnapshot() : "Salon Service";
                double uPrice = bi.getServicePriceSnapshot() != null ? bi.getServicePriceSnapshot() : 0.0;
                
                Double subMrp = null;
                if (bi.getService() != null && bi.getService().getSubServices() != null) {
                    for (com.loyalty_program_app.backend.model.SubService sub : bi.getService().getSubServices()) {
                        if (sub.getName() != null && sName.toLowerCase().contains(sub.getName().toLowerCase())) {
                            if (sub.getMrp() != null && sub.getMrp() > 0) {
                                subMrp = sub.getMrp();
                            }
                            break;
                        }
                    }
                }

                double uMrp = subMrp != null ? subMrp
                        : (bi.getService() != null && bi.getService().getMrp() != null && bi.getService().getMrp() > 0
                                ? bi.getService().getMrp()
                                : uPrice);

                if (uMrp < uPrice) {
                    uMrp = uPrice;
                }

                String img = (bi.getService() != null && bi.getService().getImage() != null && !bi.getService().getImage().isBlank())
                        ? bi.getService().getImage()
                        : "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop";

                calculatedMrp += uMrp;

                if (serviceMap.containsKey(sName)) {
                    BillItemDto existing = serviceMap.get(sName);
                    existing.setQuantity(existing.getQuantity() + 1);
                    existing.setTotalPrice(existing.getUnitPrice() * existing.getQuantity());
                    existing.setTotalMrp((existing.getUnitMrp() != null ? existing.getUnitMrp() : existing.getUnitPrice()) * existing.getQuantity());
                } else {
                    serviceMap.put(sName, BillItemDto.builder()
                            .name(sName)
                            .type("SERVICE")
                            .quantity(1)
                            .unitPrice(uPrice)
                            .totalPrice(uPrice)
                            .unitMrp(uMrp)
                            .totalMrp(uMrp)
                            .image(img)
                            .build());
                }
            }
            billItems.addAll(serviceMap.values());
        }

        if (b.getBookingProducts() != null && !b.getBookingProducts().isEmpty()) {
            for (BookingProduct bp : b.getBookingProducts()) {
                String pName = bp.getProductNameSnapshot() != null ? bp.getProductNameSnapshot() : "Retail Product";
                double uPrice = bp.getUnitPriceSnapshot() != null ? bp.getUnitPriceSnapshot() : 0.0;
                double uMrp = (bp.getProduct() != null && bp.getProduct().getMrp() != null && bp.getProduct().getMrp() > 0)
                        ? bp.getProduct().getMrp()
                        : uPrice;
                if (uMrp < uPrice) {
                    uMrp = uPrice;
                }
                int qty = bp.getQuantity() != null ? bp.getQuantity() : 1;
                double totPrice = bp.getTotalPrice() != null ? bp.getTotalPrice() : (uPrice * qty);
                double totMrp = uMrp * qty;
                String pImg = (bp.getProduct() != null && bp.getProduct().getImage() != null && !bp.getProduct().getImage().isBlank())
                        ? bp.getProduct().getImage()
                        : "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop";

                calculatedMrp += totMrp;

                billItems.add(BillItemDto.builder()
                        .name(pName)
                        .type("PRODUCT")
                        .quantity(qty)
                        .unitPrice(uPrice)
                        .totalPrice(totPrice)
                        .unitMrp(uMrp)
                        .totalMrp(totMrp)
                        .image(pImg)
                        .build());
            }
        }

        double paid = b.getPricePaid() != null ? b.getPricePaid() : (baseBookingAmount > 0 ? baseBookingAmount : calculatedMrp);
        double subtotal = calculatedMrp > baseBookingAmount ? calculatedMrp : (baseBookingAmount > 0 ? baseBookingAmount : paid);
        double mrpDiscount = Math.max(0.0, subtotal - (baseBookingAmount > 0 ? baseBookingAmount : paid));

        double codeDiscount = baseBookingAmount > paid ? Math.max(0.0, baseBookingAmount - paid) : 0.0;
        String couponCode = null;
        Double couponDiscount = null;
        String voucherCode = null;
        Double voucherDiscount = null;

        if (b.getCoupon() != null && b.getCoupon().getCode() != null) {
            String c = b.getCoupon().getCode();
            boolean isVoucher = c.toUpperCase().contains("VOUCH") || c.toUpperCase().contains("VIP");
            if (isVoucher) {
                voucherCode = c;
                voucherDiscount = codeDiscount > 0 ? codeDiscount : null;
            } else {
                couponCode = c;
                couponDiscount = codeDiscount > 0 ? codeDiscount : null;
            }
        } else if (codeDiscount > 0) {
            couponCode = "PROMO";
            couponDiscount = codeDiscount;
        }

        String coupon = b.getCoupon() != null && b.getCoupon().getCode() != null ? b.getCoupon().getCode() : (couponCode != null ? couponCode : voucherCode);

        String payMethod = "Pay at Salon";
        String payStatus = "PENDING";
        if (b.getPayment() != null) {
            if (b.getPayment().getPaymentMethod() != null) {
                payMethod = b.getPayment().getPaymentMethod().name();
            }
            if (b.getPayment().getStatus() != null) {
                payStatus = b.getPayment().getStatus().name();
            }
        }

        LocalDateTime cutoff = b.getScheduledAt() != null ? b.getScheduledAt().plusHours(2) : null;

        int coins = b.getExpectedRewardPoints() != null && b.getExpectedRewardPoints() > 0
                ? b.getExpectedRewardPoints()
                : Math.max(1, (int) Math.round(paid / 100.0));

        return BookingEmailDto.builder()
                .bookingId(b.getId() != null ? b.getId().toString() : "")
                .bookingCode(code)
                .customerName(name)
                .customerEmail(email)
                .scheduledAt(b.getScheduledAt())
                .storeName(stName)
                .storeAddress(stAddr)
                .storePhone(stPhone)
                .storeDirectionsUrl(dirUrl)
                .items(billItems)
                .totalMrp(subtotal)
                .subtotal(subtotal)
                .pricePaid(paid)
                .finalPayable(paid)
                .discountAmount(mrpDiscount)
                .mrpDiscount(mrpDiscount)
                .couponCode(couponCode)
                .couponDiscount(couponDiscount)
                .voucherCode(voucherCode)
                .voucherDiscount(voucherDiscount)
                .promoCode(coupon)
                .paymentMethod(payMethod)
                .paymentStatus(payStatus)
                .status(b.getStatus() != null ? b.getStatus().name() : "CONFIRMED")
                .note(b.getNote())
                .pointsEarned(coins)
                .autoCancelCutoffTime(cutoff)
                .build();
    }
}
