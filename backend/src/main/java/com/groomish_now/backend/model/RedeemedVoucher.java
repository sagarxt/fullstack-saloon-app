package com.groomish_now.backend.model;

import com.groomish_now.backend.enums.VoucherStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "redeemed_vouchers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RedeemedVoucher {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_id")
    private Reward reward;

    @Column(nullable = false, unique = true)
    private String voucherCode;

    private String title;
    private String description;
    private String image;

    private UUID serviceId;
    private String serviceName;
    private Integer discountPercent;

    private Integer pointsSpent;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VoucherStatus status = VoucherStatus.ACTIVE;

    private LocalDateTime redeemedAt; // Buy date
    private LocalDateTime expiresAt;  // Calculated expiry date

    @CreationTimestamp
    private LocalDateTime createdAt;
}
