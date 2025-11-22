package com.loyalty_program_app.backend.service.interfaces;

import com.loyalty_program_app.backend.dto.user.CustomerProfileUpdateRequest;
import com.loyalty_program_app.backend.dto.user.UserResponse;

import java.util.UUID;

public interface StaffProfileService {

    UserResponse getProfile(UUID staffId);

    UserResponse updateProfile(UUID staffId, CustomerProfileUpdateRequest request);
}
