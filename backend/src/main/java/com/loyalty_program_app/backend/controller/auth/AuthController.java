package com.loyalty_program_app.backend.controller.auth;

import com.loyalty_program_app.backend.dto.mail.SendOtpRequest;
import com.loyalty_program_app.backend.dto.mail.VerifyOtpRequest;
import com.loyalty_program_app.backend.dto.user.LoginRequest;
import com.loyalty_program_app.backend.dto.user.LoginResponse;
import com.loyalty_program_app.backend.dto.user.RegisterRequest;
import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.service.AuthService;
import com.loyalty_program_app.backend.service.utils.EmailService;
import com.loyalty_program_app.backend.service.utils.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final EmailService emailService;

    // CUSTOMER registration (public)
    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerCustomer(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerCustomer(request));
    }

    // ADMIN creates STAFF
    @PostMapping("/admin/register-staff")
    public ResponseEntity<UserResponse> registerStaff(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerByAdmin(request, Role.ROLE_STAFF));
    }

    // ADMIN creates another ADMIN
    @PostMapping("/admin/register-admin")
    public ResponseEntity<UserResponse> registerAdmin(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerByAdmin(request, Role.ROLE_ADMIN));
    }

    // LOGIN (ALL ROLES)
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // OTP
    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(@RequestBody SendOtpRequest request) {
        return ResponseEntity.ok(otpService.generateOtp(request.getEmail()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(otpService.verifyOtp(request.getEmail(), request.getOtp()) ? "OTP verified successfully" : "Invalid OTP");
    }
}
