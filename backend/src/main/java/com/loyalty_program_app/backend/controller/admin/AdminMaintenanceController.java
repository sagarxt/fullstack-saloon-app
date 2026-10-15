package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.maintenance.ClearDatabaseRequest;
import com.loyalty_program_app.backend.dto.maintenance.ClearDatabaseResponse;
import com.loyalty_program_app.backend.service.admin.AdminMaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/maintenance")
@RequiredArgsConstructor
public class AdminMaintenanceController {

    private final AdminMaintenanceService adminMaintenanceService;

    @PostMapping("/clear")
    public ResponseEntity<ClearDatabaseResponse> clearDatabases(@RequestBody ClearDatabaseRequest request) {
        ClearDatabaseResponse response = adminMaintenanceService.clearDatabases(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Map<String, String>> forceDeleteCategory(@PathVariable UUID id) {
        adminMaintenanceService.forceDeleteCategory(id);
        return ResponseEntity.ok(Map.of("message", "Category permanently deleted"));
    }

    @DeleteMapping("/services/{id}")
    public ResponseEntity<Map<String, String>> forceDeleteService(@PathVariable UUID id) {
        adminMaintenanceService.forceDeleteService(id);
        return ResponseEntity.ok(Map.of("message", "Service permanently deleted"));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Map<String, String>> forceDeleteProduct(@PathVariable UUID id) {
        adminMaintenanceService.forceDeleteProduct(id);
        return ResponseEntity.ok(Map.of("message", "Product permanently deleted"));
    }

    @DeleteMapping("/stores/{id}")
    public ResponseEntity<Map<String, String>> forceDeleteStore(@PathVariable UUID id) {
        adminMaintenanceService.forceDeleteStore(id);
        return ResponseEntity.ok(Map.of("message", "Store permanently deleted"));
    }

    @DeleteMapping("/customers/{id}")
    public ResponseEntity<Map<String, String>> forceDeleteCustomer(@PathVariable UUID id) {
        adminMaintenanceService.forceDeleteCustomer(id);
        return ResponseEntity.ok(Map.of("message", "Customer account permanently deleted"));
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<Map<String, String>> forceDeleteStaff(@PathVariable UUID id) {
        adminMaintenanceService.forceDeleteStaff(id);
        return ResponseEntity.ok(Map.of("message", "Staff account permanently deleted"));
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<Map<String, String>> forceDeleteCoupon(@PathVariable UUID id) {
        adminMaintenanceService.forceDeleteCoupon(id);
        return ResponseEntity.ok(Map.of("message", "Coupon permanently deleted"));
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Map<String, String>> forceDeleteBooking(@PathVariable UUID id) {
        adminMaintenanceService.forceDeleteBooking(id);
        return ResponseEntity.ok(Map.of("message", "Booking record permanently deleted"));
    }

    @DeleteMapping("/rewards/{id}")
    public ResponseEntity<Map<String, String>> forceDeleteReward(@PathVariable UUID id) {
        adminMaintenanceService.forceDeleteReward(id);
        return ResponseEntity.ok(Map.of("message", "Reward permanently deleted"));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Map<String, String>> forceDeleteReview(@PathVariable UUID id) {
        adminMaintenanceService.forceDeleteReview(id);
        return ResponseEntity.ok(Map.of("message", "Review permanently deleted"));
    }
}
