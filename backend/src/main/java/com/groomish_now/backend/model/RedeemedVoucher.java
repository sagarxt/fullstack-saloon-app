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

    private UUID productId;
    private String productName;

    @Builder.Default
    private String targetType = "ALL";

    @Builder.Default
    private String conditionOperator = "OR";

    private Integer discountPercent;
    private Double discountAmount;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "voucher_eligible_categories", joinColumns = @JoinColumn(name = "voucher_id"))
    @Column(name = "category_name")
    @Builder.Default
    private java.util.List<String> eligibleCategories = new java.util.ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "voucher_eligible_brands", joinColumns = @JoinColumn(name = "voucher_id"))
    @Column(name = "brand_name")
    @Builder.Default
    private java.util.List<String> eligibleBrands = new java.util.ArrayList<>();

    private Integer pointsSpent;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VoucherStatus status = VoucherStatus.ACTIVE;

    private LocalDateTime redeemedAt; // Buy date
    private LocalDateTime expiresAt;  // Calculated expiry date

    @CreationTimestamp
    private LocalDateTime createdAt;
}
