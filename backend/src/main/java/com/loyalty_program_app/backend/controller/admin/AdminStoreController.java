package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.store.StoreRequest;
import com.loyalty_program_app.backend.dto.store.StoreResponse;
import com.loyalty_program_app.backend.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/stores")
@RequiredArgsConstructor
public class AdminStoreController {

    private final StoreService storeService;

    @GetMapping
    public ResponseEntity<List<StoreResponse>> getAllStores() {
        return ResponseEntity.ok(storeService.getAllStoresAdmin());
    }

    @PostMapping
    public ResponseEntity<StoreResponse> createStore(@RequestBody StoreRequest request) {
        return ResponseEntity.ok(storeService.createStore(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StoreResponse> updateStore(
            @PathVariable UUID id,
            @RequestBody StoreRequest request
    ) {
        return ResponseEntity.ok(storeService.updateStore(id, request));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<StoreResponse> toggleStoreStatus(@PathVariable UUID id) {
        return ResponseEntity.ok(storeService.toggleStoreStatus(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable UUID id) {
        storeService.deleteStore(id);
        return ResponseEntity.noContent().build();
    }
}
