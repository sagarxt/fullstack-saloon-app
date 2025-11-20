package com.loyalty_program_app.backend.model;

import com.loyalty_program_app.backend.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "bookings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Booking {
    @Id
    @GeneratedValue
    private UUID id;

    private UUID userId;
    private UUID serviceId;
    private UUID paymentId;

    private OffsetDateTime scheduledAt;
    private Double pricePaid;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private String note;

    private String paymentGatewayId;
    private Instant createdAt = Instant.now();
}

