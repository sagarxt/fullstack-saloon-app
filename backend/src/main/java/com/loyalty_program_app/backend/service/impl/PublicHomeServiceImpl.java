package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.category.CategoryResponse;
import com.loyalty_program_app.backend.dto.home.PublicHomeResponse;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.model.Category;
import com.loyalty_program_app.backend.model.ServiceEntity;
import com.loyalty_program_app.backend.repository.CategoryRepository;
import com.loyalty_program_app.backend.repository.ServiceRepository;
import com.loyalty_program_app.backend.service.PublicHomeService;
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

        return dto;
    }

}
