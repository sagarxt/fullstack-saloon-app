package com.groomish_now.backend.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundDetailResponse {
    private UUID bookingId;
    private String bookingCode;
    private String razorpayPaymentId;
    private String razorpayRefundId;
    private String refundStatus; // NONE, INITIATED, PROCESSED, FAILED, PARTIAL
    private Double refundAmount;
    private Double originalPaidAmount;
    private Double depositRetained;
    private Boolean isPartial;
    private String refundArn;
    private String refundReason;
    private String speedProcessed;
    private LocalDateTime refundedAt;
    private String estimatedArrival;
    private String policyNote;
    private String message;
}
