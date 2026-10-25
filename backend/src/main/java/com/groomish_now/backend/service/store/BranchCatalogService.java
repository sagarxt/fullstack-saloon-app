package com.groomish_now.backend.service.store;

import com.groomish_now.backend.dto.branch.BranchProductResponse;
import com.groomish_now.backend.dto.branch.BranchServiceResponse;
import com.groomish_now.backend.dto.branch.UpdateBranchStockRequest;
import com.groomish_now.backend.model.User;

import java.util.List;
import java.util.UUID;

public interface BranchCatalogService {
    List<BranchServiceResponse> getBranchServices(UUID storeId);
    BranchServiceResponse toggleBranchService(UUID storeId, UUID serviceId, User actor);

    List<BranchProductResponse> getBranchProducts(UUID storeId);
    BranchProductResponse updateBranchProductInventory(UUID storeId, UUID productId, UpdateBranchStockRequest request, User actor);

    boolean isServiceAvailableAtStore(UUID storeId, UUID serviceId);
    boolean isProductAvailableAtStore(UUID storeId, UUID productId, int requestedQuantity);
    void decrementStoreStock(UUID storeId, UUID productId, int quantity);
    void restoreStoreStock(UUID storeId, UUID productId, int quantity);
}
