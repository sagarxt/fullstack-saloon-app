package com.groomish_now.backend.service.global.impl;

import com.groomish_now.backend.dto.category.CategoryResponse;
import com.groomish_now.backend.dto.service.SubServiceDto;
import com.groomish_now.backend.dto.home.PublicHomeResponse;
import com.groomish_now.backend.dto.service.ServiceResponse;
import com.groomish_now.backend.model.Category;
import com.groomish_now.backend.model.ServiceEntity;
import com.groomish_now.backend.repository.CategoryRepository;
import com.groomish_now.backend.repository.ServiceRepository;
import com.groomish_now.backend.service.global.PublicHomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicHomeServiceImpl implements PublicHomeService {

    private final CategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;

    @Override
    public PublicHomeResponse getPublicHomeData() {

        PublicHomeResponse response = new PublicHomeResponse();

        response.setCategories(
                categoryRepository.findByActiveTrue()
                        .stream()
                        .map(this::toCategoryResponse)
                        .collect(Collectors.toList())
        );

        response.setPopularServices(
                serviceRepository.findTop6ByActiveTrueOrderByCreatedAtDesc()
                        .stream()
                        .map(this::toServiceResponse)
                        .collect(Collectors.toList())
        );

        return response;
    }

    @Override
    public List<ServiceResponse> getPublicServices() {
        return serviceRepository.findByActiveTrue()
                .stream()
                .map(this::toServiceResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponse> getPublicCategories() {
        return categoryRepository.findByActiveTrue()
                .stream()
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
    }

    /* ===============================
       MAPPERS
       =============================== */

    private CategoryResponse toCategoryResponse(Category c) {
        CategoryResponse dto = new CategoryResponse();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setDescription(c.getDescription());
        dto.setImage(c.getImage());
        return dto;
    }

    private ServiceResponse toServiceResponse(ServiceEntity s) {
        ServiceResponse dto = new ServiceResponse();

        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setDescription(s.getDescription());
        dto.setImage(s.getImage());

        dto.setCategoryId(s.getCategory().getId());
        dto.setCategoryName(s.getCategory().getName());

        dto.setPrice(s.getPrice());
        dto.setMrp(s.getMrp());
        dto.setGender(s.getGender().toString());
        dto.setRewards(s.getRewards());
        dto.setDurationMinutes(s.getDurationMinutes());
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
