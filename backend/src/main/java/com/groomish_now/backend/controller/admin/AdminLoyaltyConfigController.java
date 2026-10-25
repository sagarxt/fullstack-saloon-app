package com.groomish_now.backend.controller.admin;

import com.groomish_now.backend.dto.loyalty.LoyaltyConfigDto;
import com.groomish_now.backend.service.loyalty.LoyaltyConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/groom-coin/config")
@RequiredArgsConstructor
public class AdminLoyaltyConfigController {

    private final LoyaltyConfigService loyaltyConfigService;

    @GetMapping
    public LoyaltyConfigDto getConfig() {
        return loyaltyConfigService.getConfigDto();
    }

    @PutMapping
    public LoyaltyConfigDto updateConfig(@RequestBody LoyaltyConfigDto dto) {
        return loyaltyConfigService.updateConfig(dto);
    }
}
