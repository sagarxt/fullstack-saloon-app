package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.loyalty.LoyaltyConfigDto;
import com.loyalty_program_app.backend.service.LoyaltyConfigService;
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
