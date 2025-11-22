package com.loyalty_program_app.backend.service.admin;

import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.dto.user.UserUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface UserAdminService {

    Page<UserResponse> listUsers(String search, String role, Boolean active, Pageable pageable);

    UserResponse getUser(UUID id);

    UserResponse updateUser(UUID id, UserUpdateRequest request);

    void softDeleteUser(UUID id);

    UserResponse createStaff(UserUpdateRequest request);

    UserResponse createCustomer(UserUpdateRequest request);
}
