package com.loyalty_program_app.backend.dto.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor       // <-- REQUIRED
@AllArgsConstructor      // <-- REQUIRED
public class ServiceResponse {
    private UUID id;
    private String name;
    private String description;
    private Double price;
    private Double mrp;
    private int durationMinutes;
}
