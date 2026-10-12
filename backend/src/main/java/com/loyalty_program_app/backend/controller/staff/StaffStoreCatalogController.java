package com.loyalty_program_app.backend.controller.staff;

import com.loyalty_program_app.backend.dto.branch.BranchProductResponse;
import com.loyalty_program_app.backend.dto.branch.BranchServiceResponse;
import com.loyalty_program_app.backend.dto.branch.UpdateBranchStockRequest;
import com.loyalty_program_app.backend.model.Store;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.BranchCatalogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/store")
@RequiredArgsConstructor
public class StaffStoreCatalogController {

    private final BranchCatalogService branchCatalogService;
    private final UserRepository userRepository;

    private User getStaffUser(HttpServletRequest req) {
        Object attr = req.getAttribute("userId");
        if (attr == null) {
            throw new RuntimeException("Unauthorized: user token missing.");
        }
        UUID userId = UUID.fromString(attr.toString());
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Staff member not found with ID: " + userId));
    }

    private Store getStaffStore(HttpServletRequest req) {
        User staff = getStaffUser(req);
        if (staff.getStore() == null) {
            throw new RuntimeException("Staff member is not assigned to any salon store branch.");
        }
        return staff.getStore();
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getBranchInfo(HttpServletRequest req) {
        Store store = getStaffStore(req);
        return ResponseEntity.ok(Map.of(
                "id", store.getId(),
                "name", store.getName(),
                "code", store.getCode() != null ? store.getCode() : "",
                "address", store.getAddress() != null ? store.getAddress() : "",
                "city", store.getCity() != null ? store.getCity() : ""
        ));
    }

    @GetMapping("/services")
    public ResponseEntity<List<BranchServiceResponse>> getBranchServices(HttpServletRequest req) {
        Store store = getStaffStore(req);
        return ResponseEntity.ok(branchCatalogService.getBranchServices(store.getId()));
    }

    @PutMapping("/services/{serviceId}/toggle")
    public ResponseEntity<BranchServiceResponse> toggleBranchService(
            @PathVariable UUID serviceId,
            HttpServletRequest req
    ) {
        User staff = getStaffUser(req);
        Store store = getStaffStore(req);
        return ResponseEntity.ok(branchCatalogService.toggleBranchService(store.getId(), serviceId, staff));
    }

    @GetMapping("/products")
    public ResponseEntity<List<BranchProductResponse>> getBranchProducts(HttpServletRequest req) {
        Store store = getStaffStore(req);
        return ResponseEntity.ok(branchCatalogService.getBranchProducts(store.getId()));
    }

    @PutMapping("/products/{productId}/stock")
    public ResponseEntity<BranchProductResponse> updateBranchProductStock(
            @PathVariable UUID productId,
            @RequestBody UpdateBranchStockRequest request,
            HttpServletRequest req
    ) {
        User staff = getStaffUser(req);
        Store store = getStaffStore(req);
        return ResponseEntity.ok(branchCatalogService.updateBranchProductInventory(store.getId(), productId, request, staff));
    }
}
