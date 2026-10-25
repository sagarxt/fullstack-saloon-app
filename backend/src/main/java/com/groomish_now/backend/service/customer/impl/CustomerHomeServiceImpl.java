package com.groomish_now.backend.service.customer.impl;

import com.groomish_now.backend.dto.service.SubServiceDto;
import com.groomish_now.backend.dto.banner.BannerResponse;
import com.groomish_now.backend.dto.category.CategoryResponse;
import com.groomish_now.backend.dto.home.HomeResponse;
import com.groomish_now.backend.dto.service.ServiceResponse;
import com.groomish_now.backend.model.Banner;
import com.groomish_now.backend.model.Category;
import com.groomish_now.backend.model.ServiceEntity;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.BannerRepository;
import com.groomish_now.backend.repository.CategoryRepository;
import com.groomish_now.backend.repository.ServiceRepository;
import com.groomish_now.backend.repository.UserRepository;
import com.groomish_now.backend.service.customer.CustomerHomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerHomeServiceImpl implements CustomerHomeService {

    private final BannerRepository bannerRepository;
    private final CategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;

    @Override
    public HomeResponse getHomeData(UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String gender = user.getGender() != null ? user.getGender().name() : "NOT_SPECIFIED";

        // Banners
        List<BannerResponse> banners = bannerRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                .limit(10)
                .map(this::toBannerDto)
                .toList();

        // Categories
        List<CategoryResponse> categories = categoryRepository.findByActiveTrue().stream()
                .limit(20)
                .map(this::toCategoryDto)
                .toList();

        // Active services (single query instead of multiple full table scans)
        List<ServiceEntity> activeServices = serviceRepository.findByActiveTrue();

        // Popular services (generic)
        List<ServiceResponse> popular = activeServices.stream()
                .limit(20)
                .map(this::toServiceDto)
                .toList();

        // Personalized Services
        List<ServiceResponse> personalized = activeServices.stream()
                .filter(s -> {
                    if (gender.equals("MALE")) return s.getGender().name().equals("MALE") || s.getGender().name().equals("UNISEX");
                    if (gender.equals("FEMALE")) return s.getGender().name().equals("FEMALE") || s.getGender().name().equals("UNISEX");
                    return true; // NOT_SPECIFIED → show all
                })
                .limit(20)
                .map(this::toServiceDto)
                .toList();

        // Build response
        HomeResponse home = new HomeResponse();
        home.setBanners(banners);
        home.setCategories(categories);
        home.setPopularServices(popular);
        home.setPersonalizedServices(personalized);
        home.setPoints(user.getPoints());
        home.setTier(user.getTier().name());

        return home;
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

        if (s.getSubServices() != null) {
            dto.setSubServices(s.getSubServices().stream()
                    .map(sub -> SubServiceDto.builder()
                            .id(sub.getId())
                            .name(sub.getName())
                            .description(sub.getDescription())
                            .mrp(sub.getMrp())
                            .price(sub.getPrice())
                            .durationMinutes(sub.getDurationMinutes())
                            .active(sub.isActive())
                            .build())
                    .toList());
        }

        return dto;
    }
}
