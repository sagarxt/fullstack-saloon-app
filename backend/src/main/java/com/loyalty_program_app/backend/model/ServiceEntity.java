package com.loyalty_program_app.backend.model;

import com.loyalty_program_app.backend.enums.ServiceGender;
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

    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
