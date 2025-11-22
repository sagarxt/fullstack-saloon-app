package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.dto.user.LoginRequest;
import com.loyalty_program_app.backend.dto.user.LoginResponse;
import com.loyalty_program_app.backend.dto.user.RegisterRequest;
import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.enums.Gender;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.enums.Tier;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final BCryptPasswordEncoder passwordEncoder;

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

        return toUserResponse(user);
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
    // UTILS
    // ----------------------------------------------------------
    private String generateReferralCode(String name) {
        return name.substring(0, 3).toUpperCase() + (int)(Math.random() * 900 + 100);
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
