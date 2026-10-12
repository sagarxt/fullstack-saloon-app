package com.loyalty_program_app.backend.service.staff;

import com.loyalty_program_app.backend.dto.staff.StaffProfileResponse;
import com.loyalty_program_app.backend.dto.staff.UpdateStaffProfileRequest;
import com.loyalty_program_app.backend.dto.user.ChangePasswordRequest;

import java.util.UUID;

public interface StaffProfileService {

    StaffProfileResponse getProfile(UUID staffId);

    StaffProfileResponse updateProfile(UUID staffId, UpdateStaffProfileRequest request);

    void changePassword(UUID staffId, ChangePasswordRequest request);
}
