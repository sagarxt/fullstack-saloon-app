package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.enums.Gender;
import com.loyalty_program_app.backend.enums.ServiceGender;
import com.loyalty_program_app.backend.model.Category;
import com.loyalty_program_app.backend.model.ServiceEntity;
import com.loyalty_program_app.backend.repository.CategoryRepository;
import com.loyalty_program_app.backend.repository.ServiceRepository;
import com.loyalty_program_app.backend.service.utils.CloudinaryService;
import com.loyalty_program_app.backend.service.admin.ServiceAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ServiceAdminServiceImpl implements ServiceAdminService {

    private final ServiceRepository serviceRepository;
    private final CategoryRepository categoryRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    public ServiceResponse createService(String name, UUID categoryId, String description, String gender,
                                         Double mrp, Double price, Integer rewards, Integer durationMinutes,
                                         MultipartFile image) {

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        String imageUrl = cloudinaryService.uploadImage(image);

        ServiceEntity s = new ServiceEntity();
        s.setName(name);
        s.setCategory(category);
        s.setDescription(description);
        s.setGender(ServiceGender.valueOf(gender));
        s.setMrp(mrp);
        s.setPrice(price);
        s.setRewards(rewards);
        s.setDurationMinutes(durationMinutes);
        s.setImage(imageUrl);
        s.setActive(true);

        serviceRepository.save(s);
        return toDto(s);
    }

    @Override
    public ServiceResponse updateService(UUID id, String name, UUID categoryId, String description,
                                         String gender, Double mrp, Double price, Integer rewards,
                                         Integer durationMinutes, MultipartFile image) {

        ServiceEntity s = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        if (name != null) s.setName(name);
        if (description != null) s.setDescription(description);
        if (gender != null) s.setGender(ServiceGender.valueOf(gender));
        if (mrp != null) s.setMrp(mrp);
        if (price != null) s.setPrice(price);
        if (rewards != null) s.setRewards(rewards);
        if (durationMinutes != null) s.setDurationMinutes(durationMinutes);

        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            s.setCategory(category);
        }

        if (image != null && !image.isEmpty()) {
            String url = cloudinaryService.uploadImage(image);
            s.setImage(url);
        }

        serviceRepository.save(s);
        return toDto(s);
    }

    @Override
    public void softDeleteService(UUID id) {
        ServiceEntity s = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        s.setActive(false);
        serviceRepository.save(s);
    }

    @Override
    public ServiceResponse getService(UUID id) {
        ServiceEntity s = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        return toDto(s);
    }

    @Override
    public Page<ServiceResponse> searchServices(String name, UUID categoryId, String gender,
                                                Boolean active, Double minPrice, Double maxPrice,
                                                Pageable pageable) {

        Specification<ServiceEntity> spec = Specification.where(null);

        if (name != null && !name.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
        }
        if (categoryId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("category").get("id"), categoryId));
        }
        if (gender != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("gender"), Gender.valueOf(gender)));
        }
        if (active != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("active"), active));
        }
        if (minPrice != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        }

        return serviceRepository.findAll(spec, pageable).map(this::toDto);
    }

    private ServiceResponse toDto(ServiceEntity s) {
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
