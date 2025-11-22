package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.admin.AdminRequest;
import com.loyalty_program_app.backend.dto.admin.AdminResponse;
import com.loyalty_program_app.backend.enums.Gender;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.enums.Tier;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.interfaces.AdminManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminManagementServiceImpl implements AdminManagementService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public AdminResponse createAdmin(AdminRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User admin = new User();
        admin.setName(request.getName());
        admin.setEmail(request.getEmail());
        admin.setPhone(request.getPhone());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setRole(Role.ROLE_ADMIN);
        admin.setGender(request.getGender() != null ? Gender.valueOf(request.getGender()) : Gender.NOT_SPECIFIED);
        admin.setTier(Tier.SILVER);
        admin.setActive(true);

        userRepository.save(admin);

        return toDto(admin);
    }

    @Override
    public Page<AdminResponse> listAdmins(String search, Boolean active, Pageable pageable) {

        List<User> admins = userRepository.findByRole(Role.ROLE_ADMIN);

        List<AdminResponse> filtered = admins.stream()
                .filter(a -> search == null ||
                        a.getName().toLowerCase().contains(search.toLowerCase()) ||
                        a.getEmail().toLowerCase().contains(search.toLowerCase()))
                .filter(a -> active == null || a.isActive() == active)
                .map(this::toDto)
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<AdminResponse> content = start > end ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(content, pageable, filtered.size());
    }

    @Override
    public AdminResponse updateAdmin(UUID id, AdminRequest request) {

        User admin = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (request.getName() != null) admin.setName(request.getName());
        if (request.getEmail() != null) admin.setEmail(request.getEmail());
        if (request.getPhone() != null) admin.setPhone(request.getPhone());
        if (request.getGender() != null) admin.setGender(Gender.valueOf(request.getGender()));

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            admin.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(admin);

        return toDto(admin);
    }

    @Override
    public void softDeleteAdmin(UUID id) {

        User admin = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        admin.setActive(false);
        userRepository.save(admin);
    }

    @Override
    public AdminResponse getAdmin(UUID id) {
        User admin = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        return toDto(admin);
    }

    // ===================== MANUAL MAPPER =====================
    private AdminResponse toDto(User admin) {
        AdminResponse dto = new AdminResponse();
        dto.setId(admin.getId());
        dto.setName(admin.getName());
        dto.setEmail(admin.getEmail());
        dto.setPhone(admin.getPhone());
        dto.setGender(admin.getGender().name());
        dto.setActive(admin.isActive());
        dto.setCreatedAt(
                admin.getCreatedAt() != null
                        ? admin.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        : null
        );
        return dto;
    }
}
