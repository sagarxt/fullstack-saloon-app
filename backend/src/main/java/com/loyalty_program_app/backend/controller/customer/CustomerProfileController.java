package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.user.*;
import com.loyalty_program_app.backend.security.CustomUserDetails;
import com.loyalty_program_app.backend.service.customer.CustomerProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customer/profile")
@RequiredArgsConstructor
public class CustomerProfileController {

    private final CustomerProfileService profileService;

    /* ===============================
       Get my profile
       =============================== */
    @GetMapping
    public CustomerProfileResponse getProfile(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return profileService.getMyProfile(user.getId());
    }

    /* ===============================
       Update profile
       =============================== */
    @PutMapping
    public CustomerProfileResponse updateProfile(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody UpdateCustomerProfileRequest request
    ) {
        return profileService.updateMyProfile(user.getId(), request);
    }

    /* ===============================
       Change password
       =============================== */
    @PutMapping("/change-password")
    public void changePassword(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody ChangePasswordRequest request
    ) {
        profileService.changePassword(user.getId(), request);
    }
}
