package com.loyalty_program_app.backend.dto.service;

import lombok.Data;

@Data
public class ServiceRequest {
    private String name;
    private String description;
    private Double mrp;
    private Double price;
    private int durationMinutes;
}
