package com.loyalty_program_app.backend.controller.staff;

import com.loyalty_program_app.backend.dto.staff.StaffProfileResponse;
import com.loyalty_program_app.backend.dto.staff.UpdateStaffProfileRequest;
import com.loyalty_program_app.backend.dto.user.ChangePasswordRequest;
import com.loyalty_program_app.backend.service.staff.StaffProfileService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/profile")
@RequiredArgsConstructor
public class StaffProfileController {

    private final StaffProfileService staffProfileService;

    private UUID getStaffId(HttpServletRequest req) {
        return UUID.fromString((String) req.getAttribute("userId"));
    }

    @GetMapping
    public StaffProfileResponse getProfile(HttpServletRequest req) {
        return staffProfileService.getProfile(getStaffId(req));
    }

    @PutMapping
    public StaffProfileResponse updateProfile(HttpServletRequest req, @RequestBody UpdateStaffProfileRequest request) {
        return staffProfileService.updateProfile(getStaffId(req), request);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(HttpServletRequest req, @RequestBody ChangePasswordRequest request) {
        staffProfileService.changePassword(getStaffId(req), request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
    }
}
