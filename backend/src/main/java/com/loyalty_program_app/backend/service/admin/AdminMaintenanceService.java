package com.loyalty_program_app.backend.service.admin;

import com.loyalty_program_app.backend.dto.maintenance.ClearDatabaseRequest;
import com.loyalty_program_app.backend.dto.maintenance.ClearDatabaseResponse;

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
