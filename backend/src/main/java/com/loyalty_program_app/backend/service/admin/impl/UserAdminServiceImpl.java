package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.dto.user.UserUpdateRequest;
import com.loyalty_program_app.backend.enums.Gender;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.enums.Tier;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.admin.UserAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserAdminServiceImpl implements UserAdminService {

    private final UserRepository userRepository;
    private final com.loyalty_program_app.backend.repository.StoreRepository storeRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    // ------------------------------------------
    // LIST USERS WITH SEARCH + FILTERS
    // ------------------------------------------
    @Override
    public Page<UserResponse> listUsers(String search, String role, Boolean active, Pageable pageable) {

        List<User> all = userRepository.findAll();

        List<UserResponse> filtered = all.stream()
                .filter(u -> search == null || search.isBlank() ||
                        (u.getName() != null && u.getName().toLowerCase().contains(search.toLowerCase())) ||
                        (u.getEmail() != null && u.getEmail().toLowerCase().contains(search.toLowerCase())) ||
                        (u.getPhone() != null && u.getPhone().contains(search)))
                .filter(u -> {
                    if (role == null || role.isBlank() || role.equalsIgnoreCase("ALL")) return true;
                    if (u.getRole() == null) return false;
                    String r = u.getRole().name();
                    return r.equalsIgnoreCase(role) ||
                           r.equalsIgnoreCase("ROLE_" + role) ||
                           r.replace("ROLE_", "").equalsIgnoreCase(role.replace("ROLE_", ""));
                })
                .filter(u -> active == null || u.isActive() == active)
                .map(this::toDto)
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<UserResponse> pageContent = start > end ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(pageContent, pageable, filtered.size());
    }

    // ------------------------------------------
    // GET USER BY ID
    // ------------------------------------------
    @Override
    public UserResponse getUser(UUID id) {
        return userRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ------------------------------------------
    // UPDATE USER
    // ------------------------------------------
    @Override
    public UserResponse updateUser(UUID id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getGender() != null)
            user.setGender(Gender.valueOf(request.getGender()));

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getStoreId() != null) {
            storeRepository.findById(request.getStoreId()).ifPresent(user::setStore);
        }

        userRepository.save(user);
        return toDto(user);
    }

    // ------------------------------------------
    // SOFT DELETE USER
    // ------------------------------------------
    @Override
    public void softDeleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setActive(false);
        userRepository.save(user);
    }

    // ------------------------------------------
    // CREATE STAFF
    // ------------------------------------------
    @Override
    public UserResponse createStaff(UserUpdateRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.ROLE_STAFF);
        user.setGender(Gender.NOT_SPECIFIED);
        user.setTier(Tier.SILVER);
        user.setPoints(0);
        user.setActive(true);

        if (request.getStoreId() != null) {
            storeRepository.findById(request.getStoreId()).ifPresent(user::setStore);
        }

        userRepository.save(user);
        return toDto(user);
    }

    // ------------------------------------------
    // CREATE CUSTOMER
    // ------------------------------------------
    @Override
    public UserResponse createCustomer(UserUpdateRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.ROLE_CUSTOMER);
        user.setGender(Gender.NOT_SPECIFIED);
        user.setTier(Tier.SILVER);
        user.setPoints(0);
        user.setActive(true);
        user.setReferralCode(com.loyalty_program_app.backend.util.ReferralCodeGenerator.generateUniqueReferralCode(request.getName(), userRepository));

        userRepository.save(user);
        return toDto(user);
    }

    // ------------------------------------------
    // MANUAL MAPPER
    // ------------------------------------------
    private UserResponse toDto(User user) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setImage(user.getImage());
        dto.setGender(user.getGender().name());
        dto.setRole(user.getRole().name());
        dto.setTier(user.getTier().name());
        dto.setPoints(user.getPoints());
        dto.setReferralCode(user.getReferralCode());
        dto.setActive(user.isActive());
        if (user.getStore() != null) {
            dto.setStoreId(user.getStore().getId());
            dto.setStoreName(user.getStore().getName());
            dto.setStoreCode(user.getStore().getCode());
        }
        return dto;
    }
}
