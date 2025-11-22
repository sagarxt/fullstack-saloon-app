package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.banner.BannerRequest;
import com.loyalty_program_app.backend.dto.banner.BannerResponse;
import com.loyalty_program_app.backend.model.Banner;
import com.loyalty_program_app.backend.repository.BannerRepository;
import com.loyalty_program_app.backend.service.interfaces.BannerAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BannerAdminServiceImpl implements BannerAdminService {

    private final BannerRepository bannerRepository;

    @Override
    public BannerResponse createBanner(BannerRequest request) {

        Banner b = new Banner();
        b.setTitle(request.getTitle());
        b.setRedirectUrl(request.getRedirectUrl());
        b.setImage(request.getImage());           // Cloudinary URL provided from frontend
        b.setActive(request.getActive() != null ? request.getActive() : true);

        bannerRepository.save(b);
        return toDto(b);
    }

    @Override
    public BannerResponse updateBanner(UUID id, BannerRequest request) {

        Banner b = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found"));

        if (request.getTitle() != null) b.setTitle(request.getTitle());
        if (request.getRedirectUrl() != null) b.setRedirectUrl(request.getRedirectUrl());
        if (request.getImage() != null) b.setImage(request.getImage());
        if (request.getActive() != null) b.setActive(request.getActive());

        bannerRepository.save(b);

        return toDto(b);
    }

    @Override
    public void deleteBanner(UUID id) {
        Banner b = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found"));
        b.setActive(false); // Soft delete
        bannerRepository.save(b);
    }

    @Override
    public BannerResponse getBanner(UUID id) {
        Banner b = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found"));
        return toDto(b);
    }

    @Override
    public Page<BannerResponse> searchBanners(String title, Boolean active, Pageable pageable) {

        List<Banner> all = bannerRepository.findAll();

        List<BannerResponse> filtered = all.stream()
                .filter(b -> title == null || b.getTitle().toLowerCase().contains(title.toLowerCase()))
                .filter(b -> active == null || b.isActive() == active)
                .map(this::toDto)
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());

        List<BannerResponse> content = start > end ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(content, pageable, filtered.size());
    }

    // ================ MANUAL DTO MAPPER ==================
    private BannerResponse toDto(Banner b) {
        BannerResponse dto = new BannerResponse();
        dto.setId(b.getId());
        dto.setTitle(b.getTitle());
        dto.setImage(b.getImage());
        dto.setRedirectUrl(b.getRedirectUrl());
        dto.setActive(b.isActive());
        dto.setCreatedAt(b.getCreatedAt() != null ? b.getCreatedAt().toString() : null);
        return dto;
    }
}
