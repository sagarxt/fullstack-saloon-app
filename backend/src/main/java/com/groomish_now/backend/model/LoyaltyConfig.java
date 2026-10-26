package com.groomish_now.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyConfig {

    @Id
    private Long id; // Singleton row with id = 1

    @Builder.Default
    private String coinName = "Groom Coin";

    private String coinIconUrl;

    @Builder.Default
    private Double spendAmountPerCoin = 100.0; // ₹ spend required to get 1 Groom Coin

    @Builder.Default
    private Double coinValueInInr = 1.0; // ₹ value of 1 Groom Coin when redeemed

    @Builder.Default
    private Integer silverMinPoints = 0; // Default starting tier

    @Builder.Default
    private Integer goldMinPoints = 50; // Points required for Gold VIP Tier

    @Builder.Default
    private Integer platinumMinPoints = 150; // Points required for Platinum VIP Tier

    @Builder.Default
    private Integer diamondMinPoints = 300; // Points required for Diamond VIP Tier

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
