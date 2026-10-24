package com.loyalty_program_app.backend.mapper;

import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.model.User;
import org.springframework.stereotype.Component;

import java.util.HashSet;

@Component
public class UserMapper {

    public UserResponse toUserResponse(User user) {
        if (user == null) {
            return null;
        }
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setImage(user.getImage());
        dto.setGender(user.getGender() != null ? user.getGender().name() : null);
        dto.setRole(user.getRole() != null ? user.getRole().name() : null);
        dto.setTier(user.getTier() != null ? user.getTier().name() : null);
        dto.setPoints(user.getPoints());
        dto.setLifetimePoints(user.getLifetimePoints() != null ? user.getLifetimePoints() : (user.getPoints() != null ? user.getPoints() : 0));
        dto.setReferralCode(user.getReferralCode());
        dto.setActive(user.isActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUserGroups(user.getUserGroups() != null ? new HashSet<>(user.getUserGroups()) : new HashSet<>());
        dto.setEffectiveGroups(user.getAllEffectiveGroups());
        if (user.getStore() != null) {
            dto.setStoreId(user.getStore().getId());
            dto.setStoreName(user.getStore().getName());
            dto.setStoreCode(user.getStore().getCode());
        }
        return dto;
    }
}
