package com.loyalty_program_app.backend.service.customer;

import com.loyalty_program_app.backend.dto.user.*;

import java.util.UUID;

public interface CustomerProfileService {

    CustomerProfileResponse getMyProfile(UUID userId);

    CustomerProfileResponse updateMyProfile(
            UUID userId,
            UpdateCustomerProfileRequest request
    );

    void changePassword(
            UUID userId,
            ChangePasswordRequest request
    );
}
