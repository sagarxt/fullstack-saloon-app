package com.loyalty_program_app.backend.dto.service;

import lombok.Data;
import java.util.UUID;

@Data
public class ServiceRequest {
    private String name;
    private UUID categoryId;
    private String image;
    private String description;
    private String gender;
    private Double mrp;
    private Double price;
    private Integer rewards;
    private Integer durationMinutes;
}
