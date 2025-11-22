package com.loyalty_program_app.backend.model;

import com.loyalty_program_app.backend.enums.PaymentMethod;
import com.loyalty_program_app.backend.enums.PaymentStatus;
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
    private PaymentMethod paymentMethod;

    private String paymentModeDetails;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private String paymentGatewayId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
