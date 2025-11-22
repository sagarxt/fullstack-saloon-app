package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.user.CustomerProfileUpdateRequest;
import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.service.interfaces.CustomerProfileService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/profile")
@RequiredArgsConstructor
public class CustomerProfileController {

    private final CustomerProfileService profileService;

    private UUID getCurrentUserId(HttpServletRequest request) {
        return UUID.fromString((String) request.getAttribute("userId"));
    }

    @GetMapping("/me")
    public UserResponse getProfile(HttpServletRequest request) {
        return profileService.getProfile(getCurrentUserId(request));
    }

    @PutMapping("/me")
    public UserResponse updateProfile(
            HttpServletRequest request,
            @RequestBody CustomerProfileUpdateRequest profileUpdateRequest
    ) {
        return profileService.updateProfile(getCurrentUserId(request), profileUpdateRequest);
    }

    @DeleteMapping("/me")
    public void deactivateAccount(HttpServletRequest request) {
        profileService.deactivateAccount(getCurrentUserId(request));
    }
}
