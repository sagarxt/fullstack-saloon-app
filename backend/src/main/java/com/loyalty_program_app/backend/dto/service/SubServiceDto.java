package com.loyalty_program_app.backend.dto.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubServiceDto {
    private UUID id;
    private String name;
    private Double price;
    private Integer durationMinutes;
    private Boolean active;
}
