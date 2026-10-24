package com.loyalty_program_app.backend.service.productcategory;

import com.loyalty_program_app.backend.dto.productcategory.ProductCategoryRequest;
import com.loyalty_program_app.backend.dto.productcategory.ProductCategoryResponse;

import java.util.List;
import java.util.UUID;

public interface ProductCategoryService {
    List<ProductCategoryResponse> getAllCategories();
    List<ProductCategoryResponse> getActiveCategories();
    ProductCategoryResponse getCategoryById(UUID id);
    ProductCategoryResponse createCategory(ProductCategoryRequest request);
    ProductCategoryResponse updateCategory(UUID id, ProductCategoryRequest request);
    void deleteCategory(UUID id);
}
