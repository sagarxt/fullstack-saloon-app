package com.groomish_now.backend.controller.global;

import com.groomish_now.backend.dto.loyalty.LoyaltyConfigDto;
import com.groomish_now.backend.service.loyalty.LoyaltyConfigService;
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
