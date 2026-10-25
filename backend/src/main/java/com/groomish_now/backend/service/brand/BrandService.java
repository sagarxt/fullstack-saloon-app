package com.groomish_now.backend.service.brand;

import com.groomish_now.backend.dto.brand.BrandRequest;
import com.groomish_now.backend.dto.brand.BrandResponse;

import java.util.List;
import java.util.UUID;

public interface BrandService {
    List<BrandResponse> getAllBrands();
    List<BrandResponse> getActiveBrands();
    BrandResponse getBrandById(UUID id);
    BrandResponse createBrand(BrandRequest request);
    BrandResponse updateBrand(UUID id, BrandRequest request);
    void deleteBrand(UUID id);
}
