package com.groomish_now.backend.dto.service;

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
    private String description;
    private Double mrp;
    private Double price;
    private Integer durationMinutes;
    private Boolean active;
}
