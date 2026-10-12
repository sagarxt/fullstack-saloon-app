package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.branch.BranchProductResponse;
import com.loyalty_program_app.backend.dto.branch.BranchServiceResponse;
import com.loyalty_program_app.backend.dto.branch.UpdateBranchStockRequest;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.BranchCatalogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/stores/{storeId}")
@RequiredArgsConstructor
public class AdminStoreCatalogController {

    private final BranchCatalogService branchCatalogService;
    private final UserRepository userRepository;

    private User getAdminUser(HttpServletRequest req) {
        Object attr = req.getAttribute("userId");
        if (attr == null) {
            throw new RuntimeException("Unauthorized: admin token missing.");
        }
        UUID userId = UUID.fromString(attr.toString());
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
    }

    @GetMapping("/services")
    public ResponseEntity<List<BranchServiceResponse>> getStoreServices(@PathVariable UUID storeId) {
        return ResponseEntity.ok(branchCatalogService.getBranchServices(storeId));
    }

    @PutMapping("/services/{serviceId}/toggle")
    public ResponseEntity<BranchServiceResponse> toggleStoreService(
            @PathVariable UUID storeId,
            @PathVariable UUID serviceId,
            HttpServletRequest req
    ) {
        User admin = getAdminUser(req);
        return ResponseEntity.ok(branchCatalogService.toggleBranchService(storeId, serviceId, admin));
    }

    @GetMapping("/products")
    public ResponseEntity<List<BranchProductResponse>> getStoreProducts(@PathVariable UUID storeId) {
        return ResponseEntity.ok(branchCatalogService.getBranchProducts(storeId));
    }

    @PutMapping("/products/{productId}/stock")
    public ResponseEntity<BranchProductResponse> updateStoreProductStock(
            @PathVariable UUID storeId,
            @PathVariable UUID productId,
            @RequestBody UpdateBranchStockRequest request,
            HttpServletRequest req
    ) {
        User admin = getAdminUser(req);
        return ResponseEntity.ok(branchCatalogService.updateBranchProductInventory(storeId, productId, request, admin));
    }
}
