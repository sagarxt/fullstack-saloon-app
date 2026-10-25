package com.groomish_now.backend.service.staff.impl;

import com.groomish_now.backend.dto.staff.StaffProfileResponse;
import com.groomish_now.backend.dto.staff.UpdateStaffProfileRequest;
import com.groomish_now.backend.dto.user.ChangePasswordRequest;
import com.groomish_now.backend.model.Store;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.UserRepository;
import com.groomish_now.backend.service.staff.StaffProfileService;
import com.groomish_now.backend.service.utils.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffProfileServiceImpl implements StaffProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Override
    @Transactional(readOnly = true)
    public StaffProfileResponse getProfile(UUID staffId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff user not found"));

        return toDto(staff);
    }

    @Override
    @Transactional
    public StaffProfileResponse updateProfile(UUID staffId, UpdateStaffProfileRequest request) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff user not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            staff.setName(request.getName().trim());
        }
        if (request.getPhone() != null) {
            staff.setPhone(request.getPhone().trim());
        }

        User saved = userRepository.save(staff);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void changePassword(UUID staffId, ChangePasswordRequest request) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff user not found"));

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new RuntimeException("Current password is required.");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters long.");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), staff.getPassword())) {
            throw new RuntimeException("Current password is incorrect.");
        }

        staff.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(staff);

        try {
            if (staff.getEmail() != null && !staff.getEmail().isBlank()) {
                emailService.sendPasswordChangedEmail(staff.getEmail(), staff.getName());
            }
        } catch (Exception ex) {
            log.warn("Could not dispatch password change notification email: {}", ex.getMessage());
        }
    }

    private StaffProfileResponse toDto(User user) {
        StaffProfileResponse.StaffProfileResponseBuilder builder = StaffProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : "ROLE_STAFF")
                .image(user.getImage())
                .createdAt(user.getCreatedAt());

        Store store = user.getStore();
        if (store != null) {
            builder.storeId(store.getId())
                    .storeName(store.getName())
                    .storeCode(store.getCode())
                    .storeAddress(store.getAddress())
                    .storeCity(store.getCity())
                    .storeState(store.getState())
                    .storePincode(store.getPincode())
                    .storePhone(store.getPhone())
                    .storeEmail(store.getEmail())
                    .openingTime(store.getOpeningTime())
                    .closingTime(store.getClosingTime())
                    .storeActive(store.isActive())
                    .storeImage(store.getImage())
                    .storeImages(store.getImages());
        }

        return builder.build();
    }
}
