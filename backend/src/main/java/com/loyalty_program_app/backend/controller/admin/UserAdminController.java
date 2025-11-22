package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.dto.user.UserUpdateRequest;
import com.loyalty_program_app.backend.service.interfaces.UserAdminService;
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return userAdminService.listUsers(search, role, active, pageable);
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
