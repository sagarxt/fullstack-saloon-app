package com.loyalty_program_app.backend.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceStatDto {
    private String serviceName;
    private long bookingCount;
    private double totalRevenue;
}
