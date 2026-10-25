package com.groomish_now.backend.controller.admin;

import com.groomish_now.backend.dto.store.StoreRequest;
import com.groomish_now.backend.dto.store.StoreResponse;
import com.groomish_now.backend.service.store.StoreService;
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

    @RequestMapping(value = {"/{id}/toggle-status", "/{id}/toggle"}, method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<StoreResponse> toggleStoreStatus(@PathVariable UUID id) {
        return ResponseEntity.ok(storeService.toggleStoreStatus(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable UUID id) {
        storeService.deleteStore(id);
        return ResponseEntity.noContent().build();
    }
}
