package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.banner.BannerResponse;
import com.loyalty_program_app.backend.dto.category.CategoryResponse;
import com.loyalty_program_app.backend.dto.home.PublicHomeResponse;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.model.Banner;
import com.loyalty_program_app.backend.model.Category;
import com.loyalty_program_app.backend.model.ServiceEntity;
import com.loyalty_program_app.backend.repository.BannerRepository;
import com.loyalty_program_app.backend.repository.CategoryRepository;
import com.loyalty_program_app.backend.repository.ServiceRepository;
import com.loyalty_program_app.backend.service.interfaces.PublicHomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicHomeServiceImpl implements PublicHomeService {

    private final BannerRepository bannerRepository;
    private final CategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;

    @Override
    public PublicHomeResponse getPublicHomeData() {

        List<BannerResponse> banners = bannerRepository.findAll().stream()
                .filter(Banner::isActive)
                .sorted(Comparator.comparing(Banner::getCreatedAt).reversed())
                .limit(10)
                .map(this::toBannerDto)
                .toList();

        List<CategoryResponse> categories = categoryRepository.findAll().stream()
                .filter(Category::isActive)
                .limit(20)
                .map(this::toCategoryDto)
                .toList();

        List<ServiceResponse> services = serviceRepository.findAll().stream()
                .filter(ServiceEntity::isActive)
                .limit(20)
                .map(this::toServiceDto)
                .toList();

        PublicHomeResponse dto = new PublicHomeResponse();
        dto.setBanners(banners);
        dto.setCategories(categories);
        dto.setPopularServices(services);

        return dto;
    }

    private BannerResponse toBannerDto(Banner b) {
        BannerResponse dto = new BannerResponse();
        dto.setId(b.getId());
        dto.setTitle(b.getTitle());
        dto.setImage(b.getImage());
        dto.setRedirectUrl(b.getRedirectUrl());
        dto.setActive(b.isActive());
        dto.setCreatedAt(b.getCreatedAt() != null ? b.getCreatedAt().toString() : null);
        return dto;
    }

    private CategoryResponse toCategoryDto(Category c) {
        CategoryResponse dto = new CategoryResponse();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setDescription(c.getDescription());
        dto.setImage(c.getImage());
        dto.setActive(c.isActive());
        return dto;
    }

    private ServiceResponse toServiceDto(ServiceEntity s) {
        ServiceResponse dto = new ServiceResponse();
        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setDescription(s.getDescription());
        dto.setImage(s.getImage());
        dto.setGender(s.getGender().name());
        dto.setMrp(s.getMrp());
        dto.setPrice(s.getPrice());
        dto.setDurationMinutes(s.getDurationMinutes());
        dto.setRewards(s.getRewards());
        dto.setCategoryId(s.getCategory().getId());
        dto.setCategoryName(s.getCategory().getName());
        dto.setActive(s.isActive());
        return dto;
    }
}
