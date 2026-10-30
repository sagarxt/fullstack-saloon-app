package com.groomish_now.backend.model;

import com.groomish_now.backend.enums.Gender;
import com.groomish_now.backend.enums.Role;
import com.groomish_now.backend.enums.Tier;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class User {

    @Id
    @GeneratedValue
    private UUID id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;
    private String phone;
    private String image;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private LocalDate dob;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Builder.Default
    private Integer points = 0;

    @Builder.Default
    private Integer lifetimePoints = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Tier tier = Tier.SILVER;

    @Column(unique = true)
    private String referralCode;

    private UUID createdBy;
    private UUID updatedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "store_id")
    private Store store;

    @Builder.Default
    private boolean active = true;

    private LocalDateTime lastLoginAt;
    private LocalDateTime passwordChangedAt;

    @Column(name = "expo_push_token")
    private String expoPushToken;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_groups", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "group_name")
    @Builder.Default
    private java.util.Set<String> userGroups = new java.util.HashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    public Tier calculateTierFromLifetimePoints() {
        int lifetime = (this.lifetimePoints != null && this.lifetimePoints > 0)
                ? this.lifetimePoints
                : (this.points != null ? this.points : 0);
        if (lifetime >= 300) {
            return Tier.DIAMOND;
        } else if (lifetime >= 150) {
            return Tier.PLATINUM;
        } else if (lifetime >= 50) {
            return Tier.GOLD;
        } else {
            return Tier.SILVER;
        }
    }

    public Tier getTier() {
        Tier calculated = calculateTierFromLifetimePoints();
        if (this.tier == null || this.tier.ordinal() < calculated.ordinal()) {
            return calculated;
        }
        return this.tier;
    }

    public void addPoints(int earned) {
        if (earned <= 0) return;
        this.points = (this.points != null ? this.points : 0) + earned;
        int currentLifetime = (this.lifetimePoints != null && this.lifetimePoints > 0)
                ? this.lifetimePoints
                : (this.points - earned);
        this.lifetimePoints = currentLifetime + earned;
        this.tier = calculateTierFromLifetimePoints();
    }

    public java.util.Set<String> getAllEffectiveGroups() {
        java.util.Set<String> all = new java.util.HashSet<>();
        if (this.userGroups != null) {
            all.addAll(this.userGroups);
        }
        Tier effectiveTier = this.getTier();
        if (effectiveTier != null) {
            all.add(effectiveTier.name());
        }
        if (this.createdAt != null) {
            LocalDateTime now = LocalDateTime.now();
            if (this.createdAt.isAfter(now.minusDays(30))) {
                all.add("NEW_USER");
            }
            if (this.createdAt.isBefore(now.minusYears(1))) {
                all.add("1_YEAR_PLUS");
            }
            if (this.createdAt.isBefore(now.minusYears(2))) {
                all.add("2_YEAR_PLUS");
            }
        } else {
            all.add("NEW_USER");
        }
        if (effectiveTier == Tier.GOLD || effectiveTier == Tier.PLATINUM || effectiveTier == Tier.DIAMOND || (this.lifetimePoints != null && this.lifetimePoints >= 300)) {
            all.add("VIP");
        }
        if (this.lifetimePoints != null && this.lifetimePoints >= 200) {
            all.add("FREQUENT_VISITOR");
        }
        return all;
    }
}
