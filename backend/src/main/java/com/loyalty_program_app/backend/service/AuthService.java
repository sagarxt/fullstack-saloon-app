package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.dto.AuthDtos;
import com.loyalty_program_app.backend.enums.PointsReason;
import com.loyalty_program_app.backend.enums.UserRole;
import com.loyalty_program_app.backend.model.PointsLedger;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.PointsLedgerRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.security.JwtTokenProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

//import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwt;
    private final BCryptPasswordEncoder passwordEncoder;
    private final PointsLedgerRepository pointsLedgerRepository;

    public AuthService(UserRepository userRepository,
                       JwtTokenProvider jwt,
                       PointsLedgerRepository pointsLedgerRepository) {
        this.userRepository = userRepository;
        this.jwt = jwt;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.pointsLedgerRepository = pointsLedgerRepository;
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest dto) {
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        String hashed = passwordEncoder.encode(dto.getPassword());
        String referralCode = generateReferralCode(dto.getName(), dto.getPhone());
        User u = User.builder()
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .name(dto.getName())
                .passwordHash(hashed)
                .role(UserRole.ROLE_CUSTOMER)
                .createdAt(Instant.now())
                .referralCode(referralCode)
                .points(0)
                .build();

        // if referred_by code provided, award referrer later (simple flow omitted)
        userRepository.save(u);

        // grant welcome bonus points (example 10)
        PointsLedger ledger = PointsLedger.builder()
                .userId(u.getId())
                .changeAmount(10)
                .reason(PointsReason.WELCOME_BONUS)
                .relatedId(null)
                .build();
        pointsLedgerRepository.save(ledger);
        u.setPoints((u.getPoints() == null ? 0 : u.getPoints()) + 10);
        userRepository.save(u);

        String token = jwt.generateToken(
                u.getId().toString(),
                u.getEmail(),
                u.getRole().name()     // because role is enum
        );


        AuthDtos.AuthResponse resp = new AuthDtos.AuthResponse();
        resp.setAccessToken(token);
        resp.setUserId(u.getId());
        resp.setEmail(u.getEmail());
        resp.setName(u.getName());
        return resp;
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        String token = jwt.generateToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );
        AuthDtos.AuthResponse resp = new AuthDtos.AuthResponse();
        resp.setAccessToken(token);
        resp.setEmail(user.getEmail());
        resp.setUserId(user.getId());
        resp.setName(user.getName());
        return resp;
    }

    public String generateReferralCode(String name, String mobileNumber) {
        // 1. Process Name (First 4 characters)
        String namePart;
        if (name == null || name.isBlank()) {
            // Fallback if name is empty
            namePart = "USER";
        } else {
            // Remove spaces, convert to uppercase, and take up to the first 4 characters
            String cleanName = name.replaceAll("\\s+", "").toUpperCase();
            namePart = cleanName.substring(0, Math.min(cleanName.length(), 4));

            // Pad with 'X' if the name is too short (e.g., "ED" -> "EDXX")
            while (namePart.length() < 4) {
                namePart += "X";
            }
        }

        // 2. Process Mobile Number (Last 4 digits)
        String mobilePart;
        if (mobileNumber == null || mobileNumber.length() < 4) {
            // Fallback if mobile number is missing or too short
            mobilePart = "0000";
        } else {
            // Take the last 4 digits
            mobilePart = mobileNumber.substring(mobileNumber.length() - 4);

            // Ensure the last 4 characters are actually digits (optional check)
            if (!mobilePart.matches("\\d{4}")) {
                mobilePart = "0000"; // Fallback if they aren't digits
            }
        }
        // 3. Combine and return
        return namePart + mobilePart;
    }
}
