package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.category.CategoryRequest;
import com.loyalty_program_app.backend.dto.category.CategoryResponse;
import com.loyalty_program_app.backend.service.admin.CategoryAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class CategoryAdminController {

    private final CategoryAdminService categoryAdminService;

    @PostMapping(consumes = {"multipart/form-data"})
    public CategoryResponse createCategoryMultipart(
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) String imageUrl
    ) {
        return categoryAdminService.createCategory(name, description, image, imageUrl);
    }

    @PostMapping(consumes = {"application/json"})
    public CategoryResponse createCategoryJson(@RequestBody CategoryRequest request) {
        return categoryAdminService.createCategory(request.getName(), request.getDescription(), null, request.getImage());
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public CategoryResponse updateCategoryMultipart(
            @PathVariable UUID id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) String imageUrl,
            @RequestParam(required = false) Boolean active
    ) {
        return categoryAdminService.updateCategory(id, name, description, image, imageUrl, active);
    }

    @PutMapping(value = "/{id}", consumes = {"application/json"})
    public CategoryResponse updateCategoryJson(@PathVariable UUID id, @RequestBody CategoryRequest request) {
        return categoryAdminService.updateCategory(id, request.getName(), request.getDescription(), null, request.getImage(), request.getActive());
    }

    @DeleteMapping("/{id}")
    public void deleteCategory(@PathVariable UUID id) {
        categoryAdminService.softDeleteCategory(id);
    }

    @GetMapping("/{id}")
    public CategoryResponse getCategory(@PathVariable UUID id) {
        return categoryAdminService.getCategory(id);
    }

    @GetMapping
    public Page<CategoryResponse> listCategories(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return categoryAdminService.listCategories(search, active, pageable);
    }
}
