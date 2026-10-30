package com.groomish_now.backend.service.admin.impl;

import com.groomish_now.backend.mapper.UserMapper;
import com.groomish_now.backend.repository.StoreRepository;
import com.groomish_now.backend.dto.user.UserResponse;
import com.groomish_now.backend.dto.user.UserUpdateRequest;
import com.groomish_now.backend.enums.Gender;
import com.groomish_now.backend.enums.Role;
import com.groomish_now.backend.enums.Tier;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.UserRepository;
import com.groomish_now.backend.service.admin.UserAdminService;
import com.groomish_now.backend.service.utils.EmailService;
import com.groomish_now.backend.service.utils.EmailTemplateService;
import com.groomish_now.backend.util.ReferralCodeGenerator;
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
    private final StoreRepository storeRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final EmailTemplateService templateService;
    private final UserMapper userMapper;
    private final com.groomish_now.backend.service.auth.RefreshTokenService refreshTokenService;

    // ------------------------------------------
    // LIST USERS WITH SEARCH + FILTERS
    // ------------------------------------------
    @Override
    public Page<UserResponse> listUsers(String search, String role, Boolean active, Pageable pageable) {
        return listUsers(search, role, active, null, pageable);
    }

    @Override
    public Page<UserResponse> listUsers(String search, String role, Boolean active, String userGroup, Pageable pageable) {

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
                .filter(u -> {
                    if (userGroup == null || userGroup.isBlank() || userGroup.equalsIgnoreCase("ALL")) return true;
                    return u.getAllEffectiveGroups().contains(userGroup.toUpperCase().trim());
                })
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
            user.setPasswordChangedAt(java.time.LocalDateTime.now());
            refreshTokenService.revokeAllUserTokens(user);
        }

        if (request.getStoreId() != null) {
            storeRepository.findById(request.getStoreId()).ifPresent(user::setStore);
        }

        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        if (request.getUserGroups() != null) {
            user.setUserGroups(new java.util.HashSet<>(request.getUserGroups()));
        }

        userRepository.save(user);
        return toDto(user);
    }

    @Override
    public UserResponse updateUserGroups(UUID id, java.util.Set<String> groups) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (groups != null) {
            user.setUserGroups(new java.util.HashSet<>(groups));
        } else {
            user.getUserGroups().clear();
        }
        userRepository.save(user);
        return toDto(user);
    }

    @Override
    public java.util.Map<String, Object> sendEmailToUserGroup(String userGroup, String subject, String message, String couponCode) {
        List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER).stream()
                .filter(User::isActive)
                .filter(u -> userGroup == null || userGroup.isBlank() || userGroup.equalsIgnoreCase("ALL") || u.getAllEffectiveGroups().contains(userGroup.toUpperCase().trim()))
                .toList();

        int sent = 0;
        List<String> recipients = new java.util.ArrayList<>();
        String groupLabel = (userGroup == null || userGroup.isBlank() || userGroup.equalsIgnoreCase("ALL"))
                ? "Valued Members"
                : userGroup.replace("_", " ") + " Members";

        for (User u : customers) {
            if (u.getEmail() != null && !u.getEmail().isBlank()) {
                try {
                    String content = "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #373A43; line-height: 1.6;'>"
                            + "<div style='background: linear-gradient(135deg, #FC6957, #FD7F48); padding: 28px 20px; border-radius: 18px; color: white; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(252, 105, 87, 0.25);'>"
                            + "<h1 style='margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;'>Exclusive Groomish Now Offer</h1>"
                            + "<p style='margin: 6px 0 0 0; font-size: 13px; opacity: 0.95; font-weight: 600;'>Special Perks for " + groupLabel + "</p>"
                            + "</div>"
                            + "<p style='font-size: 15px;'>Hello <strong>" + (u.getName() != null ? u.getName() : "there") + "</strong>,</p>"
                            + "<div style='background: #FFFBF9; border: 1px solid rgba(252, 105, 87, 0.2); padding: 20px; border-radius: 16px; margin: 18px 0;'>"
                            + "<p style='margin: 0; font-size: 14px; color: #373A43; white-space: pre-wrap;'>" + (message != null ? message : "") + "</p>"
                            + "</div>";

                    if (couponCode != null && !couponCode.isBlank()) {
                        content += "<div style='text-align: center; margin: 26px 0; padding: 20px; background: #FFF6EE; border-radius: 16px; border: 1.5px dashed #FC6957;'>"
                                + "<span style='font-size: 11px; font-weight: 700; text-transform: uppercase; color: #FC6957; letter-spacing: 1px; display: block; margin-bottom: 6px;'>Your Exclusive Coupon Code</span>"
                                + "<span style='display: inline-block; font-family: monospace; font-size: 24px; font-weight: 900; color: #FC6957; letter-spacing: 2px;'>"
                                + couponCode.trim().toUpperCase()
                                + "</span>"
                                + "<p style='font-size: 11px; color: #8F94A3; margin: 8px 0 0 0;'>Apply this code at checkout on the Groomish Now web app or mobile booking.</p>"
                                + "</div>";
                    }

                    content += "<p style='font-size: 12px; color: #8F94A3; text-align: center; margin-top: 24px;'>Thank you for being part of the Groomish salon community!</p></div>";

                    String finalHtml = templateService != null ? templateService.buildTemplate(subject, content) : content;
                    emailService.sendHtmlEmail(u.getEmail(), subject, finalHtml);
                    sent++;
                    recipients.add(u.getEmail());
                } catch (Exception e) {
                    // Log error and continue
                }
            }
        }

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("success", true);
        res.put("targetGroup", userGroup != null ? userGroup : "ALL");
        res.put("sentCount", sent);
        res.put("recipients", recipients);
        res.put("message", "Email successfully dispatched to " + sent + " customers in group " + groupLabel);
        return res;
    }

    @Override
    public java.util.Map<String, Object> sendEmailToIndividual(String userId, String email, String subject, String message, String couponCode) {
        User user = null;
        if (userId != null && !userId.isBlank()) {
            try {
                user = userRepository.findById(UUID.fromString(userId.trim())).orElse(null);
            } catch (Exception ignored) {}
        }
        if (user == null && email != null && !email.isBlank()) {
            user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        }

        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            java.util.Map<String, Object> err = new java.util.HashMap<>();
            err.put("success", false);
            err.put("sentCount", 0);
            err.put("message", "Target customer could not be found or has no valid email address.");
            return err;
        }

        String recipientName = user.getName() != null && !user.getName().isBlank() ? user.getName() : "Valued Customer";
        try {
            String content = "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #373A43; line-height: 1.6;'>"
                    + "<div style='background: linear-gradient(135deg, #FC6957, #FD7F48); padding: 28px 20px; border-radius: 18px; color: white; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(252, 105, 87, 0.25);'>"
                    + "<h1 style='margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;'>Exclusive Groomish Now Offer</h1>"
                    + "<p style='margin: 6px 0 0 0; font-size: 13px; opacity: 0.95; font-weight: 600;'>Special Message for " + recipientName + "</p>"
                    + "</div>"
                    + "<p style='font-size: 15px;'>Hello <strong>" + recipientName + "</strong>,</p>"
                    + "<div style='background: #FFFBF9; border: 1px solid rgba(252, 105, 87, 0.2); padding: 20px; border-radius: 16px; margin: 18px 0;'>"
                    + "<p style='margin: 0; font-size: 14px; color: #373A43; white-space: pre-wrap;'>" + (message != null ? message : "") + "</p>"
                    + "</div>";

            if (couponCode != null && !couponCode.isBlank()) {
                content += "<div style='text-align: center; margin: 26px 0; padding: 20px; background: #FFF6EE; border-radius: 16px; border: 1.5px dashed #FC6957;'>"
                        + "<span style='font-size: 11px; font-weight: 700; text-transform: uppercase; color: #FC6957; letter-spacing: 1px; display: block; margin-bottom: 6px;'>Your Exclusive Coupon Code</span>"
                        + "<span style='display: inline-block; font-family: monospace; font-size: 24px; font-weight: 900; color: #FC6957; letter-spacing: 2px;'>"
                        + couponCode.trim().toUpperCase()
                        + "</span>"
                        + "<p style='font-size: 11px; color: #8F94A3; margin: 8px 0 0 0;'>Apply this code at checkout on the Groomish Now web app or mobile booking.</p>"
                        + "</div>";
            }

            content += "<p style='font-size: 12px; color: #8F94A3; text-align: center; margin-top: 24px;'>Thank you for being part of the Groomish salon community!</p></div>";

            String finalHtml = templateService != null ? templateService.buildTemplate(subject, content) : content;
            emailService.sendHtmlEmail(user.getEmail(), subject, finalHtml);

            java.util.Map<String, Object> res = new java.util.HashMap<>();
            res.put("success", true);
            res.put("targetType", "INDIVIDUAL");
            res.put("sentCount", 1);
            res.put("recipients", java.util.List.of(user.getEmail()));
            res.put("message", "Email successfully sent to " + recipientName + " (" + user.getEmail() + ")");
            return res;
        } catch (Exception e) {
            java.util.Map<String, Object> err = new java.util.HashMap<>();
            err.put("success", false);
            err.put("sentCount", 0);
            err.put("message", "Failed to dispatch email: " + e.getMessage());
            return err;
        }
    }

    // ------------------------------------------
    // UPDATE USER STATUS (ACTIVE/DEACTIVE TOGGLE)
    // ------------------------------------------
    @Override
    public UserResponse updateUserStatus(UUID id, Boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (active != null) {
            user.setActive(active);
        } else {
            user.setActive(!user.isActive());
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
        user.setReferralCode(ReferralCodeGenerator.generateUniqueReferralCode(request.getName(), userRepository));

        userRepository.save(user);
        return toDto(user);
    }

    // ------------------------------------------
    // MANUAL MAPPER
    // ------------------------------------------
    private UserResponse toDto(User user) {
        return userMapper.toUserResponse(user);
    }
}
