package com.loyalty_program_app.backend.service.admin;

import com.loyalty_program_app.backend.dto.category.CategoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface CategoryAdminService {

    CategoryResponse createCategory(String name, String description, MultipartFile image);

    CategoryResponse updateCategory(UUID id, String name, String description, MultipartFile image);

    void softDeleteCategory(UUID id);

    CategoryResponse getCategory(UUID id);

    Page<CategoryResponse> listCategories(String search, Boolean active, Pageable pageable);
}
