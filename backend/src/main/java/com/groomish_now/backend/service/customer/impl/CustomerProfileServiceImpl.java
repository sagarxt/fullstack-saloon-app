package com.groomish_now.backend.service.customer.impl;

import com.groomish_now.backend.dto.user.ChangePasswordRequest;
import com.groomish_now.backend.dto.user.CustomerProfileResponse;
import com.groomish_now.backend.dto.user.UpdateCustomerProfileRequest;
import com.groomish_now.backend.service.utils.EmailService;
import com.groomish_now.backend.util.ReferralCodeGenerator;
import com.groomish_now.backend.dto.user.*;
import com.groomish_now.backend.enums.Gender;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.UserRepository;
import com.groomish_now.backend.service.customer.CustomerProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerProfileServiceImpl implements CustomerProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Override
    public CustomerProfileResponse getMyProfile(UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return mapToResponse(user);
    }

    @Override
    public CustomerProfileResponse updateMyProfile(
            UUID userId,
            UpdateCustomerProfileRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getDob() != null) {
            user.setDob(request.getDob());
        }
        if (request.getGender() != null) {
            user.setGender(Gender.valueOf(request.getGender()));
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        userRepository.save(user);
        return mapToResponse(user);
    }

    @Override
    public void changePassword(
            UUID userId,
            ChangePasswordRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                user.getPassword()
        )) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(
                passwordEncoder.encode(request.getNewPassword())
        );

        userRepository.save(user);

        emailService.sendPasswordChangedEmail(user.getEmail(), user.getName());
    }

    /* ===============================
       Mapper
       =============================== */
    private CustomerProfileResponse mapToResponse(User user) {

        // Guarantee user has a unique referral code
        if (user.getReferralCode() == null || user.getReferralCode().isBlank()) {
            user.setReferralCode(ReferralCodeGenerator.generateUniqueReferralCode(user.getName(), userRepository));
            userRepository.save(user);
        }

        CustomerProfileResponse dto = new CustomerProfileResponse();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setDob(user.getDob());
        dto.setGender(user.getGender() != null ? user.getGender().name() : "NOT_SPECIFIED");
        dto.setPhone(user.getPhone());
        dto.setEmail(user.getEmail());
        dto.setReferralCode(user.getReferralCode());
        dto.setMembershipTier(user.getTier() != null ? user.getTier().name() : "SILVER");
        dto.setLoyaltyPoints(user.getPoints() != null ? user.getPoints() : 0);
        dto.setLifetimePoints(user.getLifetimePoints() != null ? user.getLifetimePoints() : (user.getPoints() != null ? user.getPoints() : 0));
        return dto;
    }
}
