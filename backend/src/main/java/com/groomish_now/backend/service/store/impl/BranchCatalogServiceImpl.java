package com.groomish_now.backend.service.store.impl;

import com.groomish_now.backend.dto.service.SubServiceDto;
import com.groomish_now.backend.dto.branch.BranchProductResponse;
import com.groomish_now.backend.dto.branch.BranchServiceResponse;
import com.groomish_now.backend.dto.branch.UpdateBranchStockRequest;
import com.groomish_now.backend.enums.Role;
import com.groomish_now.backend.model.*;
import com.groomish_now.backend.repository.*;
import com.groomish_now.backend.service.store.BranchCatalogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BranchCatalogServiceImpl implements BranchCatalogService {

    private final StoreRepository storeRepository;
    private final ServiceRepository serviceRepository;
    private final ProductRepository productRepository;
    private final StoreServiceAvailabilityRepository storeServiceAvailabilityRepository;
    private final StoreProductInventoryRepository storeProductInventoryRepository;

    private void validateActorAccess(UUID storeId, User actor) {
        if (actor == null) {
            throw new RuntimeException("Authentication required to manage branch services or inventory.");
        }
        if (actor.getRole() == Role.ROLE_ADMIN) {
            return; // Super admin can manage all branches
        }
        if (actor.getRole() == Role.ROLE_STAFF) {
            if (actor.getStore() == null || !actor.getStore().getId().equals(storeId)) {
                throw new RuntimeException("Staff are only authorized to manage products and services for their own assigned branch.");
            }
            return;
        }
        throw new RuntimeException("Access denied: only branch staff or administrators can manage shop catalog.");
    }

    @Override
    @Transactional(readOnly = true)
    public List<BranchServiceResponse> getBranchServices(UUID storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Salon store branch not found with ID: " + storeId));

        List<ServiceEntity> allServices = serviceRepository.findAll();
        Map<UUID, StoreServiceAvailability> availabilityMap = storeServiceAvailabilityRepository
                .findByStoreId(storeId)
                .stream()
                .collect(Collectors.toMap(ssa -> ssa.getService().getId(), ssa -> ssa, (a, b) -> a));

        List<BranchServiceResponse> responses = new ArrayList<>();
        for (ServiceEntity s : allServices) {
            StoreServiceAvailability ssa = availabilityMap.get(s.getId());
            boolean storeActive = ssa != null ? ssa.isActive() : true; // default enabled
            boolean effectiveActive = s.isActive() && storeActive;

            responses.add(BranchServiceResponse.builder()
                    .serviceId(s.getId())
                    .name(s.getName())
                    .categoryName(s.getCategory() != null ? s.getCategory().getName() : "General Care")
                    .categoryId(s.getCategory() != null ? s.getCategory().getId() : null)
                    .gender(s.getGender() != null ? s.getGender().name() : "UNISEX")
                    .mrp(s.getMrp())
                    .price(s.getPrice())
                    .durationMinutes(s.getDurationMinutes())
                    .image(s.getImage())
                    .description(s.getDescription())
                    .globalActive(s.isActive())
                    .storeActive(storeActive)
                    .effectiveActive(effectiveActive)
                    .storeId(store.getId())
                    .storeName(store.getName())
                    .updatedBy(ssa != null ? ssa.getUpdatedBy() : null)
                    .subServices(s.getSubServices() != null ? s.getSubServices().stream()
                            .map(sub -> SubServiceDto.builder()
                                    .id(sub.getId())
                                    .name(sub.getName())
                                    .description(sub.getDescription())
                                    .mrp(sub.getMrp())
                                    .price(sub.getPrice())
                                    .durationMinutes(sub.getDurationMinutes())
                                    .active(sub.isActive())
                                    .build())
                            .toList() : java.util.Collections.emptyList())
                    .build());
        }

        // Sort by category name then service name
        responses.sort(Comparator.comparing(BranchServiceResponse::getCategoryName)
                .thenComparing(BranchServiceResponse::getName));

        return responses;
    }

    @Override
    @Transactional
    public BranchServiceResponse toggleBranchService(UUID storeId, UUID serviceId, User actor) {
        validateActorAccess(storeId, actor);

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Salon store branch not found with ID: " + storeId));
        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found with ID: " + serviceId));

        StoreServiceAvailability ssa = storeServiceAvailabilityRepository
                .findByStoreIdAndServiceId(storeId, serviceId)
                .orElse(null);

        String actorLabel = actor.getName() + " (" + actor.getRole().name().replace("ROLE_", "") + ")";

        if (ssa == null) {
            // By default was true, now toggle to false
            ssa = StoreServiceAvailability.builder()
                    .store(store)
                    .service(service)
                    .active(false)
                    .updatedBy(actorLabel)
                    .build();
        } else {
            ssa.setActive(!ssa.isActive());
            ssa.setUpdatedBy(actorLabel);
        }

        StoreServiceAvailability saved = storeServiceAvailabilityRepository.save(ssa);
        boolean storeActive = saved.isActive();
        boolean effectiveActive = service.isActive() && storeActive;

        log.info("Service '{}' ({}) availability toggled to {} for branch '{}' by {}",
                service.getName(), serviceId, storeActive, store.getName(), actorLabel);

        return BranchServiceResponse.builder()
                .serviceId(service.getId())
                .name(service.getName())
                .categoryName(service.getCategory() != null ? service.getCategory().getName() : "General Care")
                .categoryId(service.getCategory() != null ? service.getCategory().getId() : null)
                .gender(service.getGender() != null ? service.getGender().name() : "UNISEX")
                .mrp(service.getMrp())
                .price(service.getPrice())
                .durationMinutes(service.getDurationMinutes())
                .image(service.getImage())
                .description(service.getDescription())
                .rewards(service.getRewards())
                .globalActive(service.isActive())
                .storeActive(storeActive)
                .effectiveActive(effectiveActive)
                .storeId(store.getId())
                .storeName(store.getName())
                .updatedBy(saved.getUpdatedBy())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BranchProductResponse> getBranchProducts(UUID storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Salon store branch not found with ID: " + storeId));

        List<Product> allProducts = productRepository.findAll();
        Map<UUID, StoreProductInventory> inventoryMap = storeProductInventoryRepository
                .findByStoreId(storeId)
                .stream()
                .collect(Collectors.toMap(spi -> spi.getProduct().getId(), spi -> spi, (a, b) -> a));

        List<BranchProductResponse> responses = new ArrayList<>();
        for (Product p : allProducts) {
            StoreProductInventory spi = inventoryMap.get(p.getId());
            int stock = spi != null ? spi.getStockQuantity() : (p.getStockQuantity() != null ? p.getStockQuantity() : 50);
            boolean storeActive = spi != null ? spi.isActive() : true;
            int threshold = spi != null && spi.getLowStockThreshold() != null ? spi.getLowStockThreshold() : 5;
            boolean isGlobal = p.getActive() != null ? p.getActive() : true;

            boolean isOutOfStock = stock <= 0;
            boolean isLowStock = stock > 0 && stock <= threshold;
            boolean effectiveActive = isGlobal && storeActive && !isOutOfStock;

            responses.add(BranchProductResponse.builder()
                    .productId(p.getId())
                    .name(p.getName())
                    .description(p.getDescription())
                    .brand(p.getBrand())
                    .category(p.getCategory())
                    .price(p.getPrice())
                    .mrp(p.getMrp())
                    .volumeOrSize(p.getVolumeOrSize())
                    .image(p.getImage())
                    .images(p.getImages())
                    .globalActive(isGlobal)
                    .storeActive(storeActive)
                    .effectiveActive(effectiveActive)
                    .stockQuantity(stock)
                    .lowStockThreshold(threshold)
                    .lowStock(isLowStock)
                    .outOfStock(isOutOfStock)
                    .storeId(store.getId())
                    .storeName(store.getName())
                    .updatedBy(spi != null ? spi.getUpdatedBy() : null)
                    .build());
        }

        // Sort by product name
        responses.sort(Comparator.comparing(BranchProductResponse::getName));
        return responses;
    }

    @Override
    @Transactional
    public BranchProductResponse updateBranchProductInventory(UUID storeId, UUID productId, UpdateBranchStockRequest request, User actor) {
        validateActorAccess(storeId, actor);

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Salon store branch not found with ID: " + storeId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));

        StoreProductInventory spi = storeProductInventoryRepository
                .findByStoreIdAndProductId(storeId, productId)
                .orElse(null);

        String actorLabel = actor.getName() + " (" + actor.getRole().name().replace("ROLE_", "") + ")";

        if (spi == null) {
            int initialStock = request.getStockQuantity() != null
                    ? Math.max(0, request.getStockQuantity())
                    : (product.getStockQuantity() != null ? product.getStockQuantity() : 50);
            boolean initialActive = request.getActive() != null ? request.getActive() : true;
            int initialThreshold = request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 5;

            spi = StoreProductInventory.builder()
                    .store(store)
                    .product(product)
                    .stockQuantity(initialStock)
                    .active(initialActive)
                    .lowStockThreshold(initialThreshold)
                    .updatedBy(actorLabel)
                    .build();
        } else {
            if (request.getStockQuantity() != null) {
                spi.setStockQuantity(Math.max(0, request.getStockQuantity()));
            }
            if (request.getActive() != null) {
                spi.setActive(request.getActive());
            }
            if (request.getLowStockThreshold() != null) {
                spi.setLowStockThreshold(Math.max(1, request.getLowStockThreshold()));
            }
            spi.setUpdatedBy(actorLabel);
        }

        StoreProductInventory saved = storeProductInventoryRepository.save(spi);

        boolean isGlobal = product.getActive() != null ? product.getActive() : true;
        int stock = saved.getStockQuantity();
        int threshold = saved.getLowStockThreshold() != null ? saved.getLowStockThreshold() : 5;
        boolean isOutOfStock = stock <= 0;
        boolean isLowStock = stock > 0 && stock <= threshold;
        boolean effectiveActive = isGlobal && saved.isActive() && !isOutOfStock;

        log.info("Branch inventory updated for product '{}' at branch '{}': stock={}, active={}, by={}",
                product.getName(), store.getName(), stock, saved.isActive(), actorLabel);

        return BranchProductResponse.builder()
                .productId(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .brand(product.getBrand())
                .category(product.getCategory())
                .price(product.getPrice())
                .mrp(product.getMrp())
                .volumeOrSize(product.getVolumeOrSize())
                .image(product.getImage())
                .images(product.getImages())
                .globalActive(isGlobal)
                .storeActive(saved.isActive())
                .effectiveActive(effectiveActive)
                .stockQuantity(stock)
                .lowStockThreshold(threshold)
                .lowStock(isLowStock)
                .outOfStock(isOutOfStock)
                .storeId(store.getId())
                .storeName(store.getName())
                .updatedBy(saved.getUpdatedBy())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isServiceAvailableAtStore(UUID storeId, UUID serviceId) {
        if (storeId == null) return true; // Global fallback
        ServiceEntity service = serviceRepository.findById(serviceId).orElse(null);
        if (service == null || !service.isActive()) return false;

        return storeServiceAvailabilityRepository.findByStoreIdAndServiceId(storeId, serviceId)
                .map(StoreServiceAvailability::isActive)
                .orElse(true); // default true if no override
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isProductAvailableAtStore(UUID storeId, UUID productId, int requestedQuantity) {
        if (storeId == null) return true;
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null || Boolean.FALSE.equals(product.getActive())) return false;

        return storeProductInventoryRepository.findByStoreIdAndProductId(storeId, productId)
                .map(spi -> spi.isActive() && spi.getStockQuantity() >= requestedQuantity)
                .orElse(true); // default true
    }

    @Override
    @Transactional
    public void decrementStoreStock(UUID storeId, UUID productId, int quantity) {
        if (storeId == null || quantity <= 0) return;
        StoreProductInventory spi = storeProductInventoryRepository
                .findByStoreIdAndProductId(storeId, productId)
                .orElse(null);

        if (spi != null) {
            int newStock = Math.max(0, spi.getStockQuantity() - quantity);
            spi.setStockQuantity(newStock);
            storeProductInventoryRepository.save(spi);
            log.info("Decremented stock for product {} at store {} by {}. New stock: {}",
                    productId, storeId, quantity, newStock);
        }
    }

    @Override
    @Transactional
    public void restoreStoreStock(UUID storeId, UUID productId, int quantity) {
        if (storeId == null || quantity <= 0) return;
        StoreProductInventory spi = storeProductInventoryRepository
                .findByStoreIdAndProductId(storeId, productId)
                .orElse(null);

        if (spi != null) {
            int newStock = spi.getStockQuantity() + quantity;
            spi.setStockQuantity(newStock);
            storeProductInventoryRepository.save(spi);
            log.info("Restored stock for product {} at store {} by {}. New stock: {}",
                    productId, storeId, quantity, newStock);
        }
    }
}
