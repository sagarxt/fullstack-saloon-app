package com.groomish_now.backend.model;

import com.groomish_now.backend.enums.BookingStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "booking_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingItem {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "service_id")
    private ServiceEntity service;

    private String serviceNameSnapshot;
    private Double servicePriceSnapshot;
    private Integer serviceDurationSnapshot;
    private Integer serviceRewardCoinsSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(50)")
    private BookingStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
