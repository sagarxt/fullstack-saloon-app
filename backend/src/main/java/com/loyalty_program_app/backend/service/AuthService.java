package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.dto.user.LoginRequest;
import com.loyalty_program_app.backend.dto.user.LoginResponse;
import com.loyalty_program_app.backend.dto.user.RegisterRequest;
import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.enums.Gender;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.enums.Tier;
import com.loyalty_program_app.backend.model.Referral;
import com.loyalty_program_app.backend.repository.ReferralRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ReferralRepository referralRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final BCryptPasswordEncoder passwordEncoder;
    private final com.loyalty_program_app.backend.service.utils.EmailService emailService;
    private final com.loyalty_program_app.backend.service.utils.OtpService otpService;
    private final com.loyalty_program_app.backend.repository.PointsLedgerRepository pointsLedgerRepository;
    private final com.loyalty_program_app.backend.repository.NotificationRepository notificationRepository;

    // ----------------------------------------------------------
    // VERIFY REFERRAL CODE
    // ----------------------------------------------------------
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
    public UserResponse registerCustomer(RegisterRequest request) {
        return registerUser(request, Role.ROLE_CUSTOMER);
    }

    // ----------------------------------------------------------
    // ADMIN CREATES STAFF / ADMIN
    // ----------------------------------------------------------
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

            // Tier evaluation
            if (newLifetime >= 300) {
                referrer.setTier(Tier.DIAMOND);
            } else if (newLifetime >= 150) {
                referrer.setTier(Tier.PLATINUM);
            } else if (newLifetime >= 50) {
                referrer.setTier(Tier.GOLD);
            }
            userRepository.save(referrer);

            // Record in PointsLedger
            com.loyalty_program_app.backend.model.PointsLedger ledger = new com.loyalty_program_app.backend.model.PointsLedger();
            ledger.setUser(referrer);
            ledger.setChangeAmount(referralBonus);
            ledger.setReason(com.loyalty_program_app.backend.enums.PointReason.REFERRAL_BONUS);
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
            com.loyalty_program_app.backend.model.Notification notif = com.loyalty_program_app.backend.model.Notification.builder()
                    .user(referrer)
                    .title("Referral Reward Earned! 🎉")
                    .message("Your friend " + user.getName() + " joined Groomish using your referral code! 10 reward points have been credited to your account.")
                    .type(com.loyalty_program_app.backend.enums.NotificationType.OFFER)
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

        UserResponse userResponse = toUserResponse(user);
        userResponse.setToken(token);
        return userResponse;
    }

    // ----------------------------------------------------------
    // LOGIN (ALL ROLES)
    // ----------------------------------------------------------
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

        return new LoginResponse(token, toUserResponse(user));
    }

    // ----------------------------------------------------------
    // FORGOT PASSWORD & RESET PASSWORD
    // ----------------------------------------------------------
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

    public void resetPassword(com.loyalty_program_app.backend.dto.user.ResetPasswordRequest request) {
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
        userRepository.save(user);
    }

    // ----------------------------------------------------------
    // UTILS
    // ----------------------------------------------------------
    private String generateReferralCode(String name) {
        return com.loyalty_program_app.backend.util.ReferralCodeGenerator.generateUniqueReferralCode(name, userRepository);
    }

    // MANUAL MAPPER (Entity → Response DTO)
    private UserResponse toUserResponse(User user) {
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
