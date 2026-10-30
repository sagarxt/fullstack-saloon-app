package com.groomish_now.backend.service.customer;

import com.groomish_now.backend.dto.user.ChangePasswordRequest;
import com.groomish_now.backend.dto.user.CustomerProfileResponse;
import com.groomish_now.backend.dto.user.UpdateCustomerProfileRequest;
import com.groomish_now.backend.dto.user.*;

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

    void updatePushToken(
            UUID userId,
            String pushToken
    );
}
