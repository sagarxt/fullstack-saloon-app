package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.dto.user.UserUpdateRequest;
import com.loyalty_program_app.backend.service.admin.UserAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserAdminService userAdminService;

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

    // GET STANDARD USER GROUPS CATALOG
    @GetMapping("/groups")
    public java.util.List<java.util.Map<String, String>> getAvailableUserGroups() {
        return java.util.List.of(
            java.util.Map.of("id", "NEW_USER", "name", "New Customers", "description", "Joined within last 30 days or first order pending"),
            java.util.Map.of("id", "SILVER", "name", "Silver Tier", "description", "Entry level loyalty tier (1x multiplier)"),
            java.util.Map.of("id", "GOLD", "name", "Gold Tier", "description", "VIP salon patrons with 1.5x coin earn rate"),
            java.util.Map.of("id", "PLATINUM", "name", "Platinum Tier", "description", "Top salon patrons with 2x coin multiplier"),
            java.util.Map.of("id", "1_YEAR_PLUS", "name", "1 Year+ Loyalists", "description", "Patrons registered for over 1 year"),
            java.util.Map.of("id", "2_YEAR_PLUS", "name", "2 Years+ Ambassadors", "description", "Long-term VIP patrons for 2+ years"),
            java.util.Map.of("id", "VIP", "name", "VIP Members", "description", "High-value spenders and exclusive patrons"),
            java.util.Map.of("id", "FREQUENT_VISITOR", "name", "Frequent Visitors", "description", "Repeat clients with active appointments"),
            java.util.Map.of("id", "CHURN_RISK", "name", "Churn Risk / Inactive", "description", "Clients with no visit in the last 60 days"),
            java.util.Map.of("id", "STUDENT", "name", "Students", "description", "Campus / Student pass members"),
            java.util.Map.of("id", "BIRTHDAY_SPECIAL", "name", "Birthday Month", "description", "Patrons celebrating birthday this month")
        );
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

    // SEND TARGETED EMAIL TO USER GROUP
    @PostMapping("/email-group")
    public java.util.Map<String, Object> sendEmailToUserGroup(
            @RequestBody java.util.Map<String, String> payload
    ) {
        String userGroup = payload.get("userGroup");
        String subject = payload.get("subject");
        String message = payload.get("message");
        String couponCode = payload.get("couponCode");
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
