package com.groomish_now.backend.service.admin;

import com.groomish_now.backend.dto.maintenance.ClearDatabaseRequest;
import com.groomish_now.backend.dto.maintenance.ClearDatabaseResponse;

import java.util.UUID;

public interface AdminMaintenanceService {

    ClearDatabaseResponse clearDatabases(ClearDatabaseRequest request);

    void forceDeleteCategory(UUID id);

    void forceDeleteService(UUID id);

    void forceDeleteProduct(UUID id);

    void forceDeleteStore(UUID id);

    void forceDeleteCustomer(UUID id);

    void forceDeleteStaff(UUID id);

    void forceDeleteCoupon(UUID id);

    void forceDeleteBooking(UUID id);

    void forceDeleteReward(UUID id);

    void forceDeleteReview(UUID id);
}
