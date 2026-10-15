package com.loyalty_program_app.backend.controller.global;

import com.loyalty_program_app.backend.dto.product.ProductResponse;
import com.loyalty_program_app.backend.service.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/products")
@RequiredArgsConstructor
public class PublicProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductResponse> getAllProducts() {
        return productService.getAllActiveProducts();
    }

    @GetMapping("/{id}")
    public ProductResponse getProductById(@PathVariable UUID id) {
        return productService.getProductById(id);
    }

    @GetMapping("/category/{category}")
    public List<ProductResponse> getProductsByCategory(@PathVariable String category) {
        return productService.getProductsByCategory(category);
    }

    @GetMapping("/search")
    public List<ProductResponse> searchProducts(@RequestParam(required = false) String q) {
        return productService.searchProducts(q);
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        return productService.getProductCategories();
    }

    @GetMapping("/brands")
    public List<String> getBrands() {
        return productService.getProductBrands();
    }
}
