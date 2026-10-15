package com.loyalty_program_app.backend.controller.global;

import com.loyalty_program_app.backend.dto.loyalty.LoyaltyConfigDto;
import com.loyalty_program_app.backend.service.LoyaltyConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/groom-coin/config")
@RequiredArgsConstructor
public class PublicLoyaltyConfigController {

    private final LoyaltyConfigService loyaltyConfigService;

    @GetMapping
    public LoyaltyConfigDto getConfig() {
        return loyaltyConfigService.getConfigDto();
    }
}
