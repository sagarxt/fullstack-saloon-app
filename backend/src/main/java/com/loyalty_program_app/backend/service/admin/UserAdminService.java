package com.loyalty_program_app.backend.service.admin;

import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.dto.user.UserUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

public interface UserAdminService {

    Page<UserResponse> listUsers(String search, String role, Boolean active, Pageable pageable);

    Page<UserResponse> listUsers(String search, String role, Boolean active, String userGroup, Pageable pageable);

    UserResponse getUser(UUID id);

    UserResponse updateUser(UUID id, UserUpdateRequest request);

    UserResponse updateUserGroups(UUID id, Set<String> groups);

    void softDeleteUser(UUID id);

    UserResponse createStaff(UserUpdateRequest request);

    UserResponse createCustomer(UserUpdateRequest request);

    UserResponse updateUserStatus(UUID id, Boolean active);

    Map<String, Object> sendEmailToUserGroup(String userGroup, String subject, String message, String couponCode);

    Map<String, Object> sendEmailToIndividual(String userId, String email, String subject, String message, String couponCode);
}
