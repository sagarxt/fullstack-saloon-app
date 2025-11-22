package com.loyalty_program_app.backend.service.staff;

import com.loyalty_program_app.backend.dto.staff.StaffCreateCustomerRequest;
import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.dto.user.UserUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StaffCustomerService {

    UserResponse createCustomer(UUID staffId, StaffCreateCustomerRequest request);

    UserResponse updateCustomer(UUID staffId, UUID customerId, UserUpdateRequest request);

    void deactivateCustomer(UUID staffId, UUID customerId);

    UserResponse getCustomer(UUID customerId);

    Page<UserResponse> searchCustomers(String search, Boolean active, Pageable pageable);
}
