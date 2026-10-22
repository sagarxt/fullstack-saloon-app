package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.category.CategoryResponse;
import com.loyalty_program_app.backend.model.Category;
import com.loyalty_program_app.backend.repository.CategoryRepository;
import com.loyalty_program_app.backend.service.admin.CategoryAdminService;
import com.loyalty_program_app.backend.service.utils.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryAdminServiceImpl implements CategoryAdminService {

    private final CategoryRepository categoryRepository;
    private final CloudinaryService cloudinaryService;

    public CategoryAdminServiceImpl(
            CategoryRepository categoryRepository,
            CloudinaryService cloudinaryService
    ) {
        this.categoryRepository = categoryRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @Override
    public CategoryResponse createCategory(String name, String description, MultipartFile image) {
        return createCategory(name, description, image, null);
    }

    @Override
    public CategoryResponse createCategory(String name, String description, MultipartFile image, String imageUrl) {
        String finalImageUrl = null;
        if (image != null && !image.isEmpty()) {
            finalImageUrl = cloudinaryService.uploadImage(image, "groomishnow/category", name);
        } else if (imageUrl != null && !imageUrl.isBlank()) {
            String trimmedUrl = imageUrl.trim();
            if (!trimmedUrl.contains("cloudinary.com")) {
                finalImageUrl = cloudinaryService.upload(trimmedUrl, "groomishnow/category", name);
            } else {
                finalImageUrl = trimmedUrl;
            }
        }

        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        category.setImage(finalImageUrl);
        category.setActive(true);

        categoryRepository.save(category);
        return toDto(category);
    }

    @Override
    public CategoryResponse updateCategory(UUID id, String name, String description, MultipartFile image) {
        return updateCategory(id, name, description, image, null, null);
    }

    @Override
    public CategoryResponse updateCategory(UUID id, String name, String description, MultipartFile image, String imageUrl) {
        return updateCategory(id, name, description, image, imageUrl, null);
    }

    @Override
    public CategoryResponse updateCategory(UUID id, String name, String description, MultipartFile image, String imageUrl, Boolean active) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (name != null) category.setName(name);
        if (description != null) category.setDescription(description);
        if (active != null) category.setActive(active);

        String targetName = (name != null && !name.isBlank()) ? name : category.getName();

        if (image != null && !image.isEmpty()) {
            String uploadedUrl = cloudinaryService.uploadImage(image, "groomishnow/category", targetName);
            category.setImage(uploadedUrl);
        } else if (imageUrl != null && !imageUrl.isBlank()) {
            String trimmedUrl = imageUrl.trim();
            if (!trimmedUrl.contains("cloudinary.com")) {
                category.setImage(cloudinaryService.upload(trimmedUrl, "groomishnow/category", targetName));
            } else {
                category.setImage(trimmedUrl);
            }
        }

        categoryRepository.save(category);
        return toDto(category);
    }

    @Override
    public CategoryResponse updateCategoryStatus(UUID id, Boolean active) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        if (active != null) {
            category.setActive(active);
        } else {
            category.setActive(!category.isActive());
        }
        categoryRepository.save(category);
        return toDto(category);
    }

    @Override
    public void softDeleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        category.setActive(false);
        categoryRepository.save(category);
    }

    @Override
    public CategoryResponse getCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        return toDto(category);
    }

    @Override
    public Page<CategoryResponse> listCategories(String search, Boolean active, Pageable pageable) {
        List<Category> all = categoryRepository.findAll();

        // simple in-memory filter (can be optimized to JPA query later)
        List<CategoryResponse> filtered = all.stream()
                .filter(c -> search == null || c.getName().toLowerCase().contains(search.toLowerCase()))
                .filter(c -> active == null || c.isActive() == active)
                .map(this::toDto)
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<CategoryResponse> pageContent = start > end ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(pageContent, pageable, filtered.size());
    }

    private CategoryResponse toDto(Category c) {
        CategoryResponse dto = new CategoryResponse();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setDescription(c.getDescription());
        dto.setImage(c.getImage());
        dto.setActive(c.isActive());
        return dto;
    }
}
