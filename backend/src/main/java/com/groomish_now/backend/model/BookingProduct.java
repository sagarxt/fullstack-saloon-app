package com.groomish_now.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "booking_products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingProduct {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @JsonIgnore
    private Booking booking;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    private Product product;

    private String productNameSnapshot;
    private Double unitPriceSnapshot;

    @Builder.Default
    private Integer quantity = 1;

    private Double totalPrice;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
