package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.user.CustomerProfileUpdateRequest;
import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.enums.Gender;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.interfaces.StaffProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffProfileServiceImpl implements StaffProfileService {

    private final UserRepository userRepository;

    @Override
    public UserResponse getProfile(UUID staffId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        return toDto(staff);
    }

    @Override
    public UserResponse updateProfile(UUID staffId, CustomerProfileUpdateRequest request) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        if (request.getName() != null) staff.setName(request.getName());
        if (request.getPhone() != null) staff.setPhone(request.getPhone());
        if (request.getGender() != null) staff.setGender(Gender.valueOf(request.getGender()));
        if (request.getImage() != null) staff.setImage(request.getImage());

        userRepository.save(staff);
        return toDto(staff);
    }

    private UserResponse toDto(User user) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setImage(user.getImage());
        dto.setGender(user.getGender() != null ? user.getGender().name() : null);
        dto.setRole(user.getRole().name());
        dto.setTier(user.getTier().name());
        dto.setPoints(user.getPoints());
        dto.setReferralCode(user.getReferralCode());
        dto.setActive(user.isActive());
        return dto;
    }
}
