package com.groomish_now.backend.model;

import com.groomish_now.backend.enums.ServiceGender;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Table(name = "services")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceEntity {

    @Id
    @GeneratedValue
    private UUID id;

    private String name;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    private String image;
    private String description;

    @Enumerated(EnumType.STRING)
    private ServiceGender gender;

    private Double mrp;
    private Double price;

    private Integer rewards;
    private Integer durationMinutes;

    @Builder.Default
    private boolean active = true;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private java.util.List<SubService> subServices = new java.util.ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;
}
