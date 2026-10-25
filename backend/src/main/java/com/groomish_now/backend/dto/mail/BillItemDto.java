package com.groomish_now.backend.dto.mail;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillItemDto {
    private String name;
    private String type; // "SERVICE" or "PRODUCT"
    private Integer quantity;
    private Double unitPrice;
    private Double totalPrice;
    private Double unitMrp;
    private Double totalMrp;
    private String image;
}
