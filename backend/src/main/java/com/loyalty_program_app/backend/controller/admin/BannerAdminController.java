package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.banner.BannerRequest;
import com.loyalty_program_app.backend.dto.banner.BannerResponse;
import com.loyalty_program_app.backend.service.interfaces.BannerAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/banners")
@RequiredArgsConstructor
public class BannerAdminController {

    private final BannerAdminService bannerAdminService;

    @PostMapping
    public BannerResponse createBanner(@RequestBody BannerRequest request) {
        return bannerAdminService.createBanner(request);
    }

    @PutMapping("/{id}")
    public BannerResponse updateBanner(
            @PathVariable UUID id,
            @RequestBody BannerRequest request
    ) {
        return bannerAdminService.updateBanner(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteBanner(@PathVariable UUID id) {
        bannerAdminService.deleteBanner(id);
    }

    @GetMapping("/{id}")
    public BannerResponse getBanner(@PathVariable UUID id) {
        return bannerAdminService.getBanner(id);
    }

    @GetMapping
    public Page<BannerResponse> searchBanners(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return bannerAdminService.searchBanners(title, active, pageable);
    }
}
