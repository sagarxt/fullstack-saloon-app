package com.loyalty_program_app.backend.service.customer.impl;

import com.loyalty_program_app.backend.dto.user.CustomerProfileUpdateRequest;
import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.enums.Gender;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.customer.CustomerProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerProfileServiceImpl implements CustomerProfileService {

    private final UserRepository userRepository;

    @Override
    public UserResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return toDto(user);
    }

    @Override
    public UserResponse updateProfile(UUID userId, CustomerProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getGender() != null)
            user.setGender(Gender.valueOf(request.getGender()));
        if (request.getImage() != null) user.setImage(request.getImage());

        userRepository.save(user);
        return toDto(user);
    }

    @Override
    public void deactivateAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setActive(false);
        userRepository.save(user);
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
