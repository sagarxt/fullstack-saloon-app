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
@RequiredArgsConstructor
public class CategoryAdminServiceImpl implements CategoryAdminService {

    private final CategoryRepository categoryRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    public CategoryResponse createCategory(String name, String description, MultipartFile image) {
        String imageUrl = cloudinaryService.uploadImage(image);

        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        category.setImage(imageUrl);
        category.setActive(true);

        categoryRepository.save(category);
        return toDto(category);
    }

    @Override
    public CategoryResponse updateCategory(UUID id, String name, String description, MultipartFile image) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (name != null) category.setName(name);
        if (description != null) category.setDescription(description);

        if (image != null && !image.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(image);
            category.setImage(imageUrl);
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
