package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.store.StoreRequest;
import com.loyalty_program_app.backend.dto.store.StoreResponse;
import com.loyalty_program_app.backend.model.Store;
import com.loyalty_program_app.backend.repository.StoreRepository;
import com.loyalty_program_app.backend.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;

    @Override
    public List<StoreResponse> getActiveStores(Double userLat, Double userLng) {
        List<Store> stores = storeRepository.findAllByActiveTrueOrderByCreatedAtAsc();

        List<StoreResponse> dtos = stores.stream()
                .map(s -> toResponse(s, userLat, userLng))
                .collect(Collectors.toList());

        // If coordinates provided, sort by distance ascending
        if (userLat != null && userLng != null) {
            dtos.sort(Comparator.comparing(
                    StoreResponse::getDistanceKm,
                    Comparator.nullsLast(Double::compareTo)
            ));
        }

        return dtos;
    }

    @Override
    public StoreResponse getStoreById(UUID id) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store branch not found with ID: " + id));
        return toResponse(store, null, null);
    }

    @Override
    public List<StoreResponse> getAllStoresAdmin() {
        return storeRepository.findAll().stream()
                .sorted(Comparator.comparing(Store::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(s -> toResponse(s, null, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StoreResponse createStore(StoreRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("Store name is required");
        }

        String code = request.getCode();
        if (code == null || code.isBlank()) {
            // Auto-generate code based on name
            String base = request.getName().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
            code = "GN-STORE-" + (base.length() > 6 ? base.substring(0, 6) : base);
        } else {
            code = code.trim().toUpperCase();
        }

        if (storeRepository.existsByCode(code)) {
            code = code + "-" + (int) (Math.random() * 900 + 100);
        }

        List<String> images = request.getImages() != null ? new ArrayList<>(request.getImages()) : new ArrayList<>();
        String primaryImage = request.getImage();
        if ((primaryImage == null || primaryImage.isBlank()) && !images.isEmpty()) {
            primaryImage = images.get(0);
        } else if (primaryImage != null && !primaryImage.isBlank() && images.isEmpty()) {
            images.add(primaryImage);
        }

        Store store = Store.builder()
                .name(request.getName().trim())
                .code(code)
                .address(request.getAddress())
                .city(request.getCity() != null ? request.getCity().trim() : "Bangalore")
                .state(request.getState() != null ? request.getState().trim() : "Karnataka")
                .pincode(request.getPincode())
                .phone(request.getPhone())
                .email(request.getEmail())
                .image(primaryImage)
                .images(images)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .active(request.getActive() != null ? request.getActive() : true)
                .openingTime(request.getOpeningTime() != null ? request.getOpeningTime() : "09:00 AM")
                .closingTime(request.getClosingTime() != null ? request.getClosingTime() : "09:00 PM")
                .build();

        Store saved = storeRepository.save(store);
        return toResponse(saved, null, null);
    }

    @Override
    @Transactional
    public StoreResponse updateStore(UUID id, StoreRequest request) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store branch not found with ID: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            store.setName(request.getName().trim());
        }
        if (request.getCode() != null && !request.getCode().isBlank()) {
            String newCode = request.getCode().trim().toUpperCase();
            if (!newCode.equalsIgnoreCase(store.getCode()) && storeRepository.existsByCode(newCode)) {
                throw new RuntimeException("Store code " + newCode + " already exists.");
            }
            store.setCode(newCode);
        }
        if (request.getAddress() != null) store.setAddress(request.getAddress().trim());
        if (request.getCity() != null) store.setCity(request.getCity().trim());
        if (request.getState() != null) store.setState(request.getState().trim());
        if (request.getPincode() != null) store.setPincode(request.getPincode().trim());
        if (request.getPhone() != null) store.setPhone(request.getPhone().trim());
        if (request.getEmail() != null) store.setEmail(request.getEmail().trim());
        if (request.getImage() != null) store.setImage(request.getImage());
        if (request.getImages() != null) {
            store.setImages(new ArrayList<>(request.getImages()));
            if (!request.getImages().isEmpty() && (request.getImage() == null || request.getImage().isBlank())) {
                store.setImage(request.getImages().get(0));
            }
        }
        if (request.getLatitude() != null) store.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) store.setLongitude(request.getLongitude());
        if (request.getActive() != null) store.setActive(request.getActive());
        if (request.getOpeningTime() != null) store.setOpeningTime(request.getOpeningTime());
        if (request.getClosingTime() != null) store.setClosingTime(request.getClosingTime());

        Store updated = storeRepository.save(store);
        return toResponse(updated, null, null);
    }

    @Override
    @Transactional
    public StoreResponse toggleStoreStatus(UUID id) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store branch not found with ID: " + id));
        store.setActive(!store.isActive());
        Store updated = storeRepository.save(store);
        return toResponse(updated, null, null);
    }

    @Override
    @Transactional
    public void deleteStore(UUID id) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store branch not found with ID: " + id));
        store.setActive(false);
        storeRepository.save(store);
    }

    // ===================== HELPER METHODS =====================

    private StoreResponse toResponse(Store store, Double userLat, Double userLng) {
        Double distance = null;
        if (userLat != null && userLng != null && store.getLatitude() != null && store.getLongitude() != null) {
            distance = calculateHaversineDistanceKm(userLat, userLng, store.getLatitude(), store.getLongitude());
        }

        return StoreResponse.builder()
                .id(store.getId())
                .name(store.getName())
                .code(store.getCode())
                .address(store.getAddress())
                .city(store.getCity())
                .state(store.getState())
                .pincode(store.getPincode())
                .phone(store.getPhone())
                .email(store.getEmail())
                .image(store.getImage())
                .images(store.getImages() != null && !store.getImages().isEmpty() ? store.getImages() : (store.getImage() != null ? List.of(store.getImage()) : List.of()))
                .latitude(store.getLatitude())
                .longitude(store.getLongitude())
                .active(store.isActive())
                .openingTime(store.getOpeningTime())
                .closingTime(store.getClosingTime())
                .distanceKm(distance)
                .createdAt(store.getCreatedAt())
                .build();
    }

    /**
     * Haversine formula to compute great-circle distance between two geo points in kilometers.
     */
    private double calculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS_KM = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = EARTH_RADIUS_KM * c;

        // Round to 1 decimal place (e.g. 2.4 km)
        return Math.round(distance * 10.0) / 10.0;
    }
}
