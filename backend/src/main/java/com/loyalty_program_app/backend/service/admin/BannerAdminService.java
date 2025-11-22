package com.loyalty_program_app.backend.service.admin;

import com.loyalty_program_app.backend.dto.banner.BannerRequest;
import com.loyalty_program_app.backend.dto.banner.BannerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface BannerAdminService {

    BannerResponse createBanner(BannerRequest request);

    BannerResponse updateBanner(UUID id, BannerRequest request);

    void deleteBanner(UUID id); // soft delete

    BannerResponse getBanner(UUID id);

    Page<BannerResponse> searchBanners(String title, Boolean active, Pageable pageable);
}

