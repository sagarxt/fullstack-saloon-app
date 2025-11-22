package com.loyalty_program_app.backend.controller.staff;

import com.loyalty_program_app.backend.dto.user.CustomerProfileUpdateRequest;
import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.service.interfaces.StaffProfileService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/profile")
@RequiredArgsConstructor
public class StaffProfileController {

    private final StaffProfileService staffProfileService;

    private UUID getCurrentStaffId(HttpServletRequest request) {
        return UUID.fromString((String) request.getAttribute("userId"));
    }

    @GetMapping("/me")
    public UserResponse getProfile(HttpServletRequest request) {
        return staffProfileService.getProfile(getCurrentStaffId(request));
    }

    @PutMapping("/me")
    public UserResponse updateProfile(
            HttpServletRequest request,
            @RequestBody CustomerProfileUpdateRequest requestBody
    ) {
        return staffProfileService.updateProfile(getCurrentStaffId(request), requestBody);
    }
}
