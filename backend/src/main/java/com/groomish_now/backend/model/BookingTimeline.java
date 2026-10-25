package com.groomish_now.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "booking_timelines")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingTimeline {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false, length = 64)
    private String action; // e.g. CREATED, MODIFIED, RESCHEDULED, SERVICE_ADDED, SERVICE_REMOVED, PRODUCT_ADDED, PRODUCT_REMOVED, STATUS_UPDATED, COMPLETED, CANCELLED, PAYMENT_RECORDED

    @Column(nullable = false, length = 128)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String performedBy;

    @Column(length = 32)
    private String performedByRole; // CUSTOMER, STAFF, ADMIN, SYSTEM

    private String performedByEmail;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
