package com.loyalty_program_app.backend.controller.global;

import com.loyalty_program_app.backend.dto.store.StoreResponse;
import com.loyalty_program_app.backend.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/stores")
@RequiredArgsConstructor
public class PublicStoreController {

    private final StoreService storeService;
    private final com.loyalty_program_app.backend.service.BranchCatalogService branchCatalogService;

    /**
     * Get active stores sorted by proximity if lat and lng coordinates are provided.
     */
    @GetMapping
    public ResponseEntity<List<StoreResponse>> getActiveStores(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng
    ) {
        return ResponseEntity.ok(storeService.getActiveStores(lat, lng));
    }

    /**
     * Get single store branch details by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<StoreResponse> getStoreById(@PathVariable UUID id) {
        return ResponseEntity.ok(storeService.getStoreById(id));
    }

    /**
     * Get services available at this store branch.
     */
    @GetMapping("/{id}/services")
    public ResponseEntity<List<com.loyalty_program_app.backend.dto.branch.BranchServiceResponse>> getStoreServices(@PathVariable UUID id) {
        return ResponseEntity.ok(branchCatalogService.getBranchServices(id));
    }

    /**
     * Get products available at this store branch.
     */
    @GetMapping("/{id}/products")
    public ResponseEntity<List<com.loyalty_program_app.backend.dto.branch.BranchProductResponse>> getStoreProducts(@PathVariable UUID id) {
        return ResponseEntity.ok(branchCatalogService.getBranchProducts(id));
    }
}
