package com.groomish_now.backend.controller.customer;

import com.groomish_now.backend.dto.user.ChangePasswordRequest;
import com.groomish_now.backend.dto.user.CustomerProfileResponse;
import com.groomish_now.backend.dto.user.UpdateCustomerProfileRequest;
import com.groomish_now.backend.dto.user.*;
import com.groomish_now.backend.security.CustomUserDetails;
import com.groomish_now.backend.service.customer.CustomerProfileService;
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

    /* ===============================
       Register / update Expo push token
       =============================== */
    @PutMapping("/push-token")
    public void updatePushToken(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody UpdatePushTokenRequest request
    ) {
        profileService.updatePushToken(user.getId(), request.getPushToken());
    }
}
