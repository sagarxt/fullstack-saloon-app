package com.groomish_now.backend.controller.admin;

import com.groomish_now.backend.dto.user.UserResponse;
import com.groomish_now.backend.dto.user.UserUpdateRequest;
import com.groomish_now.backend.service.admin.UserAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserAdminService userAdminService;
    private final com.groomish_now.backend.service.admin.CohortAdminService cohortAdminService;

    // LIST USERS
    @GetMapping
    public Page<UserResponse> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String userGroup,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return userAdminService.listUsers(search, role, active, userGroup, pageable);
    }

    // GET STANDARD & CUSTOM COHORTS CATALOG
    @GetMapping("/groups")
    public java.util.List<java.util.Map<String, String>> getAvailableUserGroups() {
        return cohortAdminService.getAvailableUserGroupsCatalog();
    }

    // GET USER
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable UUID id) {
        return userAdminService.getUser(id);
    }

    // UPDATE USER
    @PutMapping("/{id}")
    public UserResponse updateUser(
            @PathVariable UUID id,
            @RequestBody UserUpdateRequest request
    ) {
        return userAdminService.updateUser(id, request);
    }

    // UPDATE USER GROUPS
    @PutMapping("/{id}/groups")
    public UserResponse updateUserGroups(
            @PathVariable UUID id,
            @RequestBody java.util.Set<String> groups
    ) {
        return userAdminService.updateUserGroups(id, groups);
    }

    // SEND TARGETED EMAIL TO USER GROUP OR INDIVIDUAL CUSTOMER
    @PostMapping("/email-group")
    public java.util.Map<String, Object> sendEmailToUserGroup(
            @RequestBody java.util.Map<String, String> payload
    ) {
        String recipientType = payload.get("recipientType");
        String userId = payload.get("userId");
        String email = payload.get("email");
        String userGroup = payload.get("userGroup");
        String subject = payload.get("subject");
        String message = payload.get("message");
        String couponCode = payload.get("couponCode");

        if ("INDIVIDUAL".equalsIgnoreCase(recipientType) || (userId != null && !userId.isBlank()) || (email != null && !email.isBlank())) {
            return userAdminService.sendEmailToIndividual(userId, email, subject, message, couponCode);
        }
        return userAdminService.sendEmailToUserGroup(userGroup, subject, message, couponCode);
    }

    // TOGGLE / UPDATE STATUS
    @PutMapping("/{id}/status")
    public UserResponse updateUserStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) Boolean active
    ) {
        return userAdminService.updateUserStatus(id, active);
    }

    // SOFT DELETE
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable UUID id) {
        userAdminService.softDeleteUser(id);
    }

    // CREATE STAFF
    @PostMapping("/staff")
    public UserResponse createStaff(@RequestBody UserUpdateRequest request) {
        return userAdminService.createStaff(request);
    }

    // CREATE CUSTOMER
    @PostMapping("/customer")
    public UserResponse createCustomer(@RequestBody UserUpdateRequest request) {
        return userAdminService.createCustomer(request);
    }
}
