package com.groomish_now.backend.model;

import com.groomish_now.backend.enums.PaymentMethod;
import com.groomish_now.backend.enums.PaymentStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue
    private UUID id;

    private String invoiceNumber;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(50)")
    private PaymentMethod paymentMethod;

    private String paymentModeDetails;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(50)")
    private PaymentStatus status;

    private String paymentGatewayId;

    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
    private LocalDateTime paidAt;

    private String razorpayRefundId;
    private Double refundedAmount;
    private String refundStatus;
    private String refundArn;
    private String refundReason;
    private LocalDateTime refundedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
