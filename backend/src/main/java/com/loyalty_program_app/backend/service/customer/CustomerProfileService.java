package com.loyalty_program_app.backend.service.customer;

import com.loyalty_program_app.backend.dto.user.CustomerProfileUpdateRequest;
import com.loyalty_program_app.backend.dto.user.UserResponse;

import java.util.UUID;

public interface CustomerProfileService {

    UserResponse getProfile(UUID userId);

    UserResponse updateProfile(UUID userId, CustomerProfileUpdateRequest request);

    void deactivateAccount(UUID userId);
}
