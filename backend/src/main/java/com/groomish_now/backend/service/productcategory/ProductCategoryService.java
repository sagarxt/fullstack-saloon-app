package com.groomish_now.backend.service.productcategory;

import com.groomish_now.backend.dto.productcategory.ProductCategoryRequest;
import com.groomish_now.backend.dto.productcategory.ProductCategoryResponse;

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
