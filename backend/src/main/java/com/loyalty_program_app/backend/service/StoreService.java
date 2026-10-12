package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.dto.store.StoreRequest;
import com.loyalty_program_app.backend.dto.store.StoreResponse;

import java.util.List;
import java.util.UUID;

public interface StoreService {

    // Public
    List<StoreResponse> getActiveStores(Double userLat, Double userLng);

    StoreResponse getStoreById(UUID id);

    // Admin
    List<StoreResponse> getAllStoresAdmin();

    StoreResponse createStore(StoreRequest request);

    StoreResponse updateStore(UUID id, StoreRequest request);

    StoreResponse toggleStoreStatus(UUID id);

    void deleteStore(UUID id);
}
