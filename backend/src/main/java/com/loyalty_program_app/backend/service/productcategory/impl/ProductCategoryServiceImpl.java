package com.loyalty_program_app.backend.service.productcategory.impl;

import com.loyalty_program_app.backend.dto.productcategory.ProductCategoryRequest;
import com.loyalty_program_app.backend.dto.productcategory.ProductCategoryResponse;
import com.loyalty_program_app.backend.model.Product;
import com.loyalty_program_app.backend.model.ProductCategory;
import com.loyalty_program_app.backend.repository.ProductCategoryRepository;
import com.loyalty_program_app.backend.repository.ProductRepository;
import com.loyalty_program_app.backend.service.productcategory.ProductCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductCategoryServiceImpl implements ProductCategoryService {

    private final ProductCategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public List<ProductCategoryResponse> getAllCategories() {
        syncExistingProductCategoriesIfEmpty();
        List<ProductCategory> list = categoryRepository.findAllByOrderByCreatedAtDesc();
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<ProductCategoryResponse> getActiveCategories() {
        syncExistingProductCategoriesIfEmpty();
        List<ProductCategory> list = categoryRepository.findByActiveTrueOrderByNameAsc();
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public ProductCategoryResponse getCategoryById(UUID id) {
        ProductCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product category not found with ID: " + id));
        return toResponse(cat);
    }

    @Override
    @Transactional
    public ProductCategoryResponse createCategory(ProductCategoryRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Category name is required");
        }
        String trimmedName = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new IllegalArgumentException("Category '" + trimmedName + "' already exists");
        }

        ProductCategory cat = ProductCategory.builder()
                .name(trimmedName)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .active(request.getActive() == null || request.getActive())
                .build();

        ProductCategory saved = categoryRepository.save(cat);
        log.info("Created new product category: {} ({})", saved.getName(), saved.getId());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ProductCategoryResponse updateCategory(UUID id, ProductCategoryRequest request) {
        ProductCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product category not found with ID: " + id));

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Category name cannot be empty");
        }

        String newName = request.getName().trim();
        String oldName = cat.getName();

        if (!oldName.equalsIgnoreCase(newName) && categoryRepository.existsByNameIgnoreCase(newName)) {
            throw new IllegalArgumentException("Category '" + newName + "' already exists");
        }

        // If category name was renamed, update existing products referencing the old category name
        if (!oldName.equalsIgnoreCase(newName)) {
            List<Product> productsToUpdate = productRepository.findByCategoryIgnoreCase(oldName);
            if (!productsToUpdate.isEmpty()) {
                for (Product p : productsToUpdate) {
                    p.setCategory(newName);
                }
                productRepository.saveAll(productsToUpdate);
                log.info("Updated {} products from category '{}' to '{}'", productsToUpdate.size(), oldName, newName);
            }
        }

        cat.setName(newName);
        if (request.getDescription() != null) {
            cat.setDescription(request.getDescription().trim());
        }
        if (request.getActive() != null) {
            cat.setActive(request.getActive());
        }

        ProductCategory updated = categoryRepository.save(cat);
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCategory(UUID id) {
        ProductCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product category not found with ID: " + id));

        long count = productRepository.countByCategoryIgnoreCase(cat.getName());
        if (count > 0) {
            throw new IllegalStateException("Cannot delete category '" + cat.getName() + "' because " + count + " product(s) are currently assigned to it. Please reassign or delete those products first.");
        }

        categoryRepository.delete(cat);
        log.info("Deleted product category: {} ({})", cat.getName(), id);
    }

    private void syncExistingProductCategoriesIfEmpty() {
        try {
            if (categoryRepository.count() == 0) {
                List<String> distinctCategories = productRepository.findDistinctCategories();
                if (distinctCategories != null && !distinctCategories.isEmpty()) {
                    List<ProductCategory> seedList = new ArrayList<>();
                    for (String cName : distinctCategories) {
                        if (cName != null && !cName.trim().isEmpty()) {
                            seedList.add(ProductCategory.builder()
                                    .name(cName.trim())
                                    .active(true)
                                    .build());
                        }
                    }
                    if (!seedList.isEmpty()) {
                        categoryRepository.saveAll(seedList);
                        log.info("Synced {} existing distinct product categories from products table to product_categories table", seedList.size());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not sync distinct product categories: {}", e.getMessage());
        }
    }

    private ProductCategoryResponse toResponse(ProductCategory cat) {
        long count = productRepository.countByCategoryIgnoreCase(cat.getName());
        return ProductCategoryResponse.builder()
                .id(cat.getId())
                .name(cat.getName())
                .description(cat.getDescription())
                .active(cat.isActive())
                .productCount(count)
                .createdAt(cat.getCreatedAt())
                .updatedAt(cat.getUpdatedAt())
                .build();
    }
}
