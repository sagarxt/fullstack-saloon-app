package com.groomish_now.backend.service.payment;

import com.groomish_now.backend.dto.payment.RefundDetailResponse;
import com.groomish_now.backend.model.Booking;

import java.util.UUID;

public interface RazorpayRefundService {

    /**
     * Evaluates cancellation refund eligibility based on 2-hour window policy,
     * calculates full vs partial refund (retaining deposit if applicable),
     * and calls Razorpay Refund API if online payment was completed.
     */
    RefundDetailResponse processCancellationRefund(Booking booking);

    /**
     * Admin/Staff manual partial or full refund with custom amount and reason.
     */
    RefundDetailResponse initiateCustomRefund(UUID bookingId, Double amount, String reason);

    /**
     * Queries Razorpay API in real-time to check live refund status,
     * synchronization of ARN / bank reference, and returns full refund details for UI.
     */
    RefundDetailResponse getLiveRefundStatus(UUID bookingId);
}
