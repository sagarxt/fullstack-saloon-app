package com.loyalty_program_app.backend.model;

import com.loyalty_program_app.backend.enums.BookingStatus;
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
            this.bookingCode = com.loyalty_program_app.backend.util.BookingCodeGenerator.generateCode();
        }
    }

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    private List<BookingItem> bookingItems;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingProduct> bookingProducts;

    @ManyToOne
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @ManyToOne
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    private LocalDateTime scheduledAt;

    private Double totalAmount;
    private Double pricePaid;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private String note;

    private Integer totalDurationMinutes;

    private String bookedBy;

    private LocalDateTime cancelledAt;
    private LocalDateTime completedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

