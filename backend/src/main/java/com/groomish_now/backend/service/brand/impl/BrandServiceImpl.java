package com.groomish_now.backend.service.brand.impl;

import com.groomish_now.backend.dto.brand.BrandRequest;
import com.groomish_now.backend.dto.brand.BrandResponse;
import com.groomish_now.backend.model.Brand;
import com.groomish_now.backend.model.Product;
import com.groomish_now.backend.repository.BrandRepository;
import com.groomish_now.backend.repository.ProductRepository;
import com.groomish_now.backend.service.brand.BrandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public List<BrandResponse> getAllBrands() {
        syncExistingProductBrandsIfEmpty();
        List<Brand> brands = brandRepository.findAllByOrderByCreatedAtDesc();
        return brands.stream().map(this::toResponse).toList();
    }

    @Override
    public List<BrandResponse> getActiveBrands() {
        return brandRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public BrandResponse getBrandById(UUID id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Brand not found with ID: " + id));
        return toResponse(brand);
    }

    @Override
    @Transactional
    public BrandResponse createBrand(BrandRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Brand name is required");
        }
        String cleanName = request.getName().trim();

        if (brandRepository.existsByNameIgnoreCase(cleanName)) {
            throw new IllegalArgumentException("A brand with the name '" + cleanName + "' already exists");
        }

        Brand brand = Brand.builder()
                .name(cleanName)
                .logo(request.getLogo() != null && !request.getLogo().trim().isEmpty() ? request.getLogo().trim() : null)
                .shortDescription(request.getShortDescription() != null && !request.getShortDescription().trim().isEmpty() ? request.getShortDescription().trim() : null)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Brand saved = brandRepository.save(brand);
        log.info("Created new brand: {} ({})", saved.getName(), saved.getId());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public BrandResponse updateBrand(UUID id, BrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Brand not found with ID: " + id));

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Brand name cannot be empty");
        }

        String newName = request.getName().trim();
        String oldName = brand.getName();

        if (brandRepository.existsByNameIgnoreCaseAndIdNot(newName, id)) {
            throw new IllegalArgumentException("Another brand with the name '" + newName + "' already exists");
        }

        // If the brand name changed, cascade update products that use the old brand name
        if (!oldName.equalsIgnoreCase(newName)) {
            List<Product> productsToUpdate = productRepository.findByBrandIgnoreCase(oldName);
            if (!productsToUpdate.isEmpty()) {
                for (Product p : productsToUpdate) {
                    p.setBrand(newName);
                }
                productRepository.saveAll(productsToUpdate);
                log.info("Cascaded brand name rename from '{}' to '{}' across {} products", oldName, newName, productsToUpdate.size());
            }
        }

        brand.setName(newName);
        brand.setLogo(request.getLogo() != null && !request.getLogo().trim().isEmpty() ? request.getLogo().trim() : null);
        brand.setShortDescription(request.getShortDescription() != null && !request.getShortDescription().trim().isEmpty() ? request.getShortDescription().trim() : null);
        if (request.getActive() != null) {
            brand.setActive(request.getActive());
        }

        Brand updated = brandRepository.save(brand);
        log.info("Updated brand: {} ({})", updated.getName(), updated.getId());
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBrand(UUID id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Brand not found with ID: " + id));

        String brandName = brand.getName();
        brandRepository.delete(brand);
        log.info("Deleted brand: {} ({})", brandName, id);
    }

    /**
     * Auto-seed any brands already used in Products if the brands table is empty
     */
    private void syncExistingProductBrandsIfEmpty() {
        if (brandRepository.count() == 0) {
            List<String> distinctBrands = productRepository.findDistinctBrands();
            if (distinctBrands != null && !distinctBrands.isEmpty()) {
                List<Brand> seedList = new ArrayList<>();
                for (String bName : distinctBrands) {
                    if (bName != null && !bName.trim().isEmpty()) {
                        seedList.add(Brand.builder()
                                .name(bName.trim())
                                .shortDescription("Premium salon care product brand.")
                                .active(true)
                                .build());
                    }
                }
                if (!seedList.isEmpty()) {
                    brandRepository.saveAll(seedList);
                    log.info("Auto-seeded {} existing product brands into the brands table", seedList.size());
                }
            }
        }
    }

    private BrandResponse toResponse(Brand b) {
        long count = productRepository.countByBrandIgnoreCase(b.getName());
        return BrandResponse.builder()
                .id(b.getId())
                .name(b.getName())
                .logo(b.getLogo())
                .shortDescription(b.getShortDescription())
                .active(b.isActive())
                .productCount(count)
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
