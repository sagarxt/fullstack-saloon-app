package com.groomish_now.backend.model;

import com.groomish_now.backend.enums.PointReason;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "points_ledger")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointsLedger {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private Integer changeAmount;

    @Enumerated(EnumType.STRING)
    private PointReason reason;

    private UUID relatedId;
    private String note;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
