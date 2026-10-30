package com.groomish_now.backend.service.auth.impl;

import com.groomish_now.backend.dto.auth.*;
import com.groomish_now.backend.dto.user.*;
import com.groomish_now.backend.enums.Gender;
import com.groomish_now.backend.enums.NotificationType;
import com.groomish_now.backend.enums.PointReason;
import com.groomish_now.backend.enums.Role;
import com.groomish_now.backend.enums.Tier;
import com.groomish_now.backend.mapper.UserMapper;
import com.groomish_now.backend.model.Notification;
import com.groomish_now.backend.model.PointsLedger;
import com.groomish_now.backend.model.Referral;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.NotificationRepository;
import com.groomish_now.backend.repository.PointsLedgerRepository;
import com.groomish_now.backend.repository.ReferralRepository;
import com.groomish_now.backend.repository.UserRepository;
import com.groomish_now.backend.security.JwtTokenProvider;
import com.groomish_now.backend.service.auth.AuthService;
import com.groomish_now.backend.service.utils.EmailService;
import com.groomish_now.backend.service.utils.OtpService;
import com.groomish_now.backend.util.ReferralCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ReferralRepository referralRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final OtpService otpService;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final NotificationRepository notificationRepository;
    private final UserMapper userMapper;
    private final com.groomish_now.backend.service.loyalty.LoyaltyConfigService loyaltyConfigService;
    private final com.groomish_now.backend.service.auth.RefreshTokenService refreshTokenService;

    // ----------------------------------------------------------
    // VERIFY REFERRAL CODE
    // ----------------------------------------------------------
    @Override
    public Map<String, Object> verifyReferralCode(String code) {
        if (code == null || code.trim().isBlank()) {
            return Map.of("valid", false, "message", "Invalid Referral Code");
        }
        return userRepository.findByReferralCode(code.trim().toUpperCase())
                .map(user -> Map.<String, Object>of(
                        "valid", true,
                        "referrerName", user.getName(),
                        "message", "Valid referral code from " + user.getName()
                ))
                .orElse(Map.of(
                        "valid", false,
                        "message", "Invalid Referral Code"
                ));
    }

    // ----------------------------------------------------------
    // CUSTOMER REGISTRATION
    // ----------------------------------------------------------
    @Override
    public UserResponse registerCustomer(RegisterRequest request) {
        return registerUser(request, Role.ROLE_CUSTOMER);
    }

    // ----------------------------------------------------------
    // ADMIN CREATES STAFF / ADMIN
    // ----------------------------------------------------------
    @Override
    public UserResponse registerByAdmin(RegisterRequest request, Role role) {
        return registerUser(request, role);
    }

    /**
     * Helper method to handle user registration logic
     * @param request The registration request containing user details
     * @param role The role to assign to the user
     * @return UserResponse with the created user's details
     */
    private UserResponse registerUser(RegisterRequest request, Role role) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User referrer = null;
        if (request.getReferralCode() != null && !request.getReferralCode().trim().isBlank()) {
            String refCode = request.getReferralCode().trim().toUpperCase();
            referrer = userRepository.findByReferralCode(refCode)
                    .orElseThrow(() -> new RuntimeException("Invalid Referral Code"));
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setGender(Gender.NOT_SPECIFIED);
        user.setTier(Tier.SILVER);
        user.setPoints(0);
        user.setActive(true);
        user.setReferralCode(generateReferralCode(request.getName()));

        userRepository.save(user);

        if (referrer != null) {
            int referralBonus = 10;
            int newPoints = (referrer.getPoints() != null ? referrer.getPoints() : 0) + referralBonus;
            int newLifetime = (referrer.getLifetimePoints() != null ? referrer.getLifetimePoints() : (referrer.getPoints() != null ? referrer.getPoints() : 0)) + referralBonus;
            referrer.setPoints(newPoints);
            referrer.setLifetimePoints(newLifetime);

            // Tier evaluation via configured ranges
            Tier newTier = loyaltyConfigService.calculateTier(newLifetime, referrer.getTier());
            referrer.setTier(newTier);
            userRepository.save(referrer);


            // Record in PointsLedger
            PointsLedger ledger = new PointsLedger();
            ledger.setUser(referrer);
            ledger.setChangeAmount(referralBonus);
            ledger.setReason(PointReason.REFERRAL_BONUS);
            ledger.setRelatedId(user.getId());
            ledger.setNote("Referred to " + user.getName());
            ledger.setCreatedAt(java.time.LocalDateTime.now());
            pointsLedgerRepository.save(ledger);

            Referral referral = Referral.builder()
                    .referrer(referrer)
                    .referred(user)
                    .rewardGiven(true)
                    .pointsLedger(ledger)
                    .build();
            referralRepository.save(referral);

            // In-app Notification for referrer
            Notification notif = Notification.builder()
                    .user(referrer)
                    .title("Referral Reward Earned! 🎉")
                    .message("Your friend " + user.getName() + " joined Groomish using your referral code! 10 reward points have been credited to your account.")
                    .type(NotificationType.OFFER)
                    .seen(false)
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);

            // Dispatch Real-time Referral Bonus Email to Referrer
            if (referrer.getEmail() != null && !referrer.getEmail().isBlank()) {
                emailService.sendReferralBonusEmail(
                        referrer.getEmail(),
                        referrer.getName(),
                        user.getName(),
                        referralBonus,
                        referrer.getPoints()
                );
            }
        }

        if (role == Role.ROLE_CUSTOMER) {
            emailService.sendWelcomeEmail(user.getEmail(), user.getName(), user.getReferralCode());
        }

        String token = jwtTokenProvider.generateToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );

        com.groomish_now.backend.model.RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        UserResponse userResponse = toUserResponse(user);
        userResponse.setToken(token);
        userResponse.setAccessToken(token);
        userResponse.setRefreshToken(refreshToken.getToken());
        return userResponse;
    }

    // ----------------------------------------------------------
    // LOGIN (ALL ROLES)
    // ----------------------------------------------------------
    @Override
    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtTokenProvider.generateToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );

        com.groomish_now.backend.model.RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        UserResponse userResponse = toUserResponse(user);
        userResponse.setToken(token);
        userResponse.setAccessToken(token);
        userResponse.setRefreshToken(refreshToken.getToken());

        return LoginResponse.builder()
                .token(token)
                .accessToken(token)
                .refreshToken(refreshToken.getToken())
                .expiresIn(jwtTokenProvider.getExpirationMs() / 1000)
                .user(userResponse)
                .build();
    }

    // ----------------------------------------------------------
    // REFRESH TOKEN (ROTATION)
    // ----------------------------------------------------------
    @Override
    @org.springframework.transaction.annotation.Transactional
    public RefreshTokenResponse refreshToken(String refreshTokenStr) {
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            throw new RuntimeException("Refresh token is required");
        }

        com.groomish_now.backend.model.RefreshToken token = refreshTokenService.findByToken(refreshTokenStr)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        token = refreshTokenService.verifyExpiration(token);
        User user = token.getUser();
        if (!user.isActive()) {
            throw new RuntimeException("User account is disabled");
        }

        // Revoke the old refresh token (refresh token rotation)
        refreshTokenService.revokeToken(refreshTokenStr);

        // Issue new refresh token & access token
        com.groomish_now.backend.model.RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);
        String newAccessToken = jwtTokenProvider.generateToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );

        UserResponse userResponse = toUserResponse(user);
        userResponse.setToken(newAccessToken);
        userResponse.setAccessToken(newAccessToken);
        userResponse.setRefreshToken(newRefreshToken.getToken());

        return RefreshTokenResponse.builder()
                .token(newAccessToken)
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMs() / 1000)
                .user(userResponse)
                .build();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void logout(String refreshTokenStr) {
        if (refreshTokenStr != null && !refreshTokenStr.isBlank()) {
            refreshTokenService.revokeToken(refreshTokenStr);
        }
    }

    @Override
    public long getRefreshExpirationSeconds() {
        return jwtTokenProvider.getRefreshExpirationMs() / 1000;
    }

    // ----------------------------------------------------------
    // FORGOT PASSWORD & RESET PASSWORD
    // ----------------------------------------------------------
    @Override
    public void sendForgotPasswordOtp(String email) {
        if (email == null || email.trim().isBlank()) {
            throw new RuntimeException("Email is required");
        }
        String cleanEmail = email.trim().toLowerCase();
        userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("No registered account found with this email"));

        Boolean sent = otpService.generateOtp(cleanEmail);
        if (!Boolean.TRUE.equals(sent)) {
            throw new RuntimeException("Failed to dispatch OTP. Please verify your email address.");
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getOtp() == null || request.getNewPassword() == null) {
            throw new RuntimeException("Email, OTP, and new password are required");
        }
        String cleanEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("No registered account found with this email"));

        boolean validOtp = otpService.verifyOtp(cleanEmail, request.getOtp().trim());
        if (!validOtp) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        if (request.getNewPassword().trim().length() < 4) {
            throw new RuntimeException("Password must be at least 4 characters long");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        user.setPasswordChangedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        // Revoke all refresh tokens on password change
        refreshTokenService.revokeAllUserTokens(user);
    }

    // ----------------------------------------------------------
    // UTILS
    // ----------------------------------------------------------
    private String generateReferralCode(String name) {
        return ReferralCodeGenerator.generateUniqueReferralCode(name, userRepository);
    }

    // MANUAL MAPPER (Entity → Response DTO)
    private UserResponse toUserResponse(User user) {
        return userMapper.toUserResponse(user);
    }
}
