package com.groomish_now.backend.dto.booking;

import com.groomish_now.backend.dto.product.BookingProductResponse;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class BookingResponse {
    private UUID id;
    private String bookingCode;
    private UUID userId;
    private String userName;
    private String userEmail;
    private String userPhone;
    private UUID paymentId;
    private UUID couponId;
    private String couponCode;
    private String couponApplied;
    private Double totalAmount;
    private Double pricePaid;
    private Double remainingAmount;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private String invoiceNumber;
    private LocalDateTime scheduledAt;
    private String note;
    private String bookedBy;
    private UUID serviceId;
    private String serviceName;
    private UUID storeId;
    private String storeName;
    private String storeAddress;
    private Double storeLatitude;
    private Double storeLongitude;
    private Integer expectedRewardPoints;
    private Boolean pointsConfirmed;
    private List<BookingItemDetailsResponse> items;
    private List<BookingProductResponse> products;
    private List<BookingTimelineResponse> timeline;
    private LocalDateTime checkedInAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;

    private String refundStatus;
    private Double refundAmount;
    private String razorpayRefundId;
    private String refundArn;
    private String refundReason;
    private LocalDateTime refundedAt;
    private Integer rescheduleCount;

    private LocalDateTime createdAt;
}
