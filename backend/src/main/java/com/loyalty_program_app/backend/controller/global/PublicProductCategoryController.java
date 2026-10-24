package com.loyalty_program_app.backend.controller.global;

import com.loyalty_program_app.backend.dto.productcategory.ProductCategoryResponse;
import com.loyalty_program_app.backend.service.productcategory.ProductCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/product-categories")
@RequiredArgsConstructor
public class PublicProductCategoryController {

    private final ProductCategoryService productCategoryService;

    @GetMapping
    public List<ProductCategoryResponse> getActiveCategories() {
        return productCategoryService.getActiveCategories();
    }
}
