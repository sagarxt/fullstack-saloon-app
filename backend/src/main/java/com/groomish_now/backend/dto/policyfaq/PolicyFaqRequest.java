package com.groomish_now.backend.dto.policyfaq;

import com.groomish_now.backend.enums.PolicyFaqType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicyFaqRequest {
    private PolicyFaqType type;
    private String category;
    private String heading;
    private String description;
    private Integer displayOrder;
    private Boolean active;
}
