package com.groomish_now.backend.dto.loyalty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyConfigDto {
    private String coinName;
    private String coinIconUrl;
    private Double spendAmountPerCoin;
    private Double coinValueInInr;
    private Integer silverMinPoints;
    private Integer goldMinPoints;
    private Integer platinumMinPoints;
    private Integer diamondMinPoints;
}

