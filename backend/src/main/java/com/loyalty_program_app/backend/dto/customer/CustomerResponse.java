package com.loyalty_program_app.backend.dto.customer;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private boolean active;
    private int totalBookings;
    private double totalSpent;
}
