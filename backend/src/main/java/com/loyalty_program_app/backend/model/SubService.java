package com.loyalty_program_app.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "sub_services")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubService {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    @JsonBackReference
    private ServiceEntity service;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double price;

    private Integer durationMinutes;

    @Builder.Default
    private boolean active = true;
}
