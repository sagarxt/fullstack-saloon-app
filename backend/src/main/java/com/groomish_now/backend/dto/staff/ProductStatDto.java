package com.groomish_now.backend.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductStatDto {
    private String productName;
    private long quantitySold;
    private double totalRevenue;
}
