package com.groomish_now.backend.model;

import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.util.BookingCodeGenerator;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "bookings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "booking_code", unique = true, length = 32)
    private String bookingCode;

    @PrePersist
    public void ensureBookingCode() {
        if (this.bookingCode == null || this.bookingCode.isBlank()) {
            this.bookingCode = BookingCodeGenerator.generateCode();
        }
    }

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    private List<BookingItem> bookingItems;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingProduct> bookingProducts;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<BookingTimeline> timeline;

    @ManyToOne
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @ManyToOne
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "store_id")
    private Store store;

    private String storeNameSnapshot;
    private String storeAddressSnapshot;

    private LocalDateTime scheduledAt;

    private Double totalAmount;
    private Double pricePaid;
    private String razorpayOrderId;

    public Double getRemainingAmount() {
        double total = this.totalAmount != null ? this.totalAmount : 0.0;
        double paid = this.pricePaid != null ? this.pricePaid : 0.0;
        return Math.max(0.0, total - paid);
    }

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private String note;

    private Integer totalDurationMinutes;

    private String bookedBy;

    private LocalDateTime checkedInAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime completedAt;

    @Column(name = "expected_reward_points")
    private Integer expectedRewardPoints;

    @Builder.Default
    private Boolean reminder24hSent = false;

    @Builder.Default
    private Boolean reminder2hSent = false;

    @Builder.Default
    private Boolean reminderOneHourSent = false;

    @Builder.Default
    private Boolean reminderThirtyMinSent = false;

    @Builder.Default
    private Boolean reminderStartSent = false;

    @Builder.Default
    private Boolean warningPostOneHourSent = false;

    @Builder.Default
    private Boolean autoCancelled = false;

    @Builder.Default
    private String refundStatus = "NONE";

    private Double refundAmount;
    private String razorpayRefundId;
    private String refundArn;
    private String refundReason;
    private LocalDateTime refundedAt;

    @Builder.Default
    private Integer rescheduleCount = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

