package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.productcategory.ProductCategoryRequest;
import com.loyalty_program_app.backend.dto.productcategory.ProductCategoryResponse;
import com.loyalty_program_app.backend.service.productcategory.ProductCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/product-categories")
@RequiredArgsConstructor
public class AdminProductCategoryController {

    private final ProductCategoryService productCategoryService;

    @GetMapping
    public List<ProductCategoryResponse> getAllCategories() {
        return productCategoryService.getAllCategories();
    }

    @GetMapping("/{id}")
    public ProductCategoryResponse getCategoryById(@PathVariable UUID id) {
        return productCategoryService.getCategoryById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductCategoryResponse createCategory(@RequestBody ProductCategoryRequest request) {
        return productCategoryService.createCategory(request);
    }

    @PutMapping("/{id}")
    public ProductCategoryResponse updateCategory(@PathVariable UUID id, @RequestBody ProductCategoryRequest request) {
        return productCategoryService.updateCategory(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable UUID id) {
        productCategoryService.deleteCategory(id);
    }
}
