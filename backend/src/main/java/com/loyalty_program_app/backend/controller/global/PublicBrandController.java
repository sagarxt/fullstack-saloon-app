package com.loyalty_program_app.backend.controller.global;

import com.loyalty_program_app.backend.dto.brand.BrandResponse;
import com.loyalty_program_app.backend.service.brand.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/brands")
@RequiredArgsConstructor
public class PublicBrandController {

    private final BrandService brandService;

    @GetMapping
    public List<BrandResponse> getActiveBrands() {
        return brandService.getActiveBrands();
    }

    @GetMapping("/{id}")
    public BrandResponse getBrandById(@PathVariable UUID id) {
        return brandService.getBrandById(id);
    }
}
