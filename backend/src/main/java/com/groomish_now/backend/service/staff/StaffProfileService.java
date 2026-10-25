package com.groomish_now.backend.service.staff;

import com.groomish_now.backend.dto.staff.StaffProfileResponse;
import com.groomish_now.backend.dto.staff.UpdateStaffProfileRequest;
import com.groomish_now.backend.dto.user.ChangePasswordRequest;

import java.util.UUID;

public interface StaffProfileService {

    StaffProfileResponse getProfile(UUID staffId);

    StaffProfileResponse updateProfile(UUID staffId, UpdateStaffProfileRequest request);

    void changePassword(UUID staffId, ChangePasswordRequest request);
}
