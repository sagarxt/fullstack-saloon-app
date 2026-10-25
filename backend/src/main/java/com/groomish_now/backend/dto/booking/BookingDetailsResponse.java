package com.groomish_now.backend.dto.booking;

import com.groomish_now.backend.dto.product.BookingProductResponse;
import com.groomish_now.backend.dto.review.ServiceReviewResponse;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BookingDetailsResponse {

    private UUID id;
    private String bookingCode;

    private String status;
    private String scheduledAt;
    private String bookedAt;
    private String bookedBy;

    private Double totalAmount;
    private Double pricePaid;

    private String couponApplied;

    private UUID storeId;
    private String storeName;
    private String storeAddress;
    private Double storeLatitude;
    private Double storeLongitude;

    private UUID paymentId;
    private String paymentMethod;
    private String paymentStatus;
    private String invoiceNumber;
    private Long graceMinutesRemaining;
    private Boolean warning1HourSent;
    private Integer expectedRewardPoints;
    private Boolean pointsConfirmed;

    private List<BookingItemDetailsResponse> items;
    private List<BookingProductResponse> products;
    private List<BookingTimelineResponse> timeline;
    private List<ServiceReviewResponse> customerReviews;
}
