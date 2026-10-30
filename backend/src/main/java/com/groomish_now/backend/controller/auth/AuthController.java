package com.groomish_now.backend.controller.auth;

import com.groomish_now.backend.dto.auth.*;
import com.groomish_now.backend.dto.user.UserResponse;
import com.groomish_now.backend.enums.Role;
import com.groomish_now.backend.service.auth.AuthService;
import com.groomish_now.backend.service.utils.EmailService;
import com.groomish_now.backend.service.utils.OtpService;
import com.groomish_now.backend.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final EmailService emailService;

    @Value("${app.jwt.cookie-secure:false}")
    private boolean cookieSecure;

    @Value("${app.jwt.cookie-same-site:}")
    private String cookieSameSite;

    // CUSTOMER registration (public)
    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerCustomer(
            @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        UserResponse response = authService.registerCustomer(request);
        if (response.getRefreshToken() != null) {
            CookieUtil.createRefreshTokenCookie(
                    httpRequest,
                    httpResponse,
                    response.getRefreshToken(),
                    authService.getRefreshExpirationSeconds(),
                    cookieSecure,
                    cookieSameSite
            );
        }
        return ResponseEntity.ok(response);
    }

    // VERIFY REFERRAL CODE (public)
    @GetMapping("/verify-referral")
    public ResponseEntity<?> verifyReferral(@RequestParam("code") String code) {
        Map<String, Object> result = authService.verifyReferralCode(code);
        if (Boolean.TRUE.equals(result.get("valid"))) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
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
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        LoginResponse response = authService.login(request);
        if (response.getRefreshToken() != null) {
            CookieUtil.createRefreshTokenCookie(
                    httpRequest,
                    httpResponse,
                    response.getRefreshToken(),
                    authService.getRefreshExpirationSeconds(),
                    cookieSecure,
                    cookieSameSite
            );
        }
        return ResponseEntity.ok(response);
    }

    // REFRESH TOKEN (Web HttpOnly cookie + Mobile request body/header support)
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @RequestBody(required = false) RefreshTokenRequest requestBody,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String token = CookieUtil.getRefreshTokenFromCookie(httpRequest).orElse(null);

        if ((token == null || token.isBlank()) && requestBody != null) {
            token = requestBody.getRefreshToken();
        }

        if ((token == null || token.isBlank())) {
            token = httpRequest.getHeader("X-Refresh-Token");
        }

        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Refresh token is missing", "code", "REFRESH_TOKEN_REQUIRED"));
        }

        try {
            RefreshTokenResponse response = authService.refreshToken(token);
            CookieUtil.createRefreshTokenCookie(
                    httpRequest,
                    httpResponse,
                    response.getRefreshToken(),
                    authService.getRefreshExpirationSeconds(),
                    cookieSecure,
                    cookieSameSite
            );
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            CookieUtil.deleteRefreshTokenCookie(httpRequest, httpResponse, cookieSecure, cookieSameSite);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", ex.getMessage(), "code", "INVALID_REFRESH_TOKEN"));
        }
    }

    // OTP
    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(@RequestBody SendOtpRequest request) {
        return ResponseEntity.ok(otpService.generateOtp(request.getEmail()) ? "success" : "failed");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(otpService.verifyOtp(request.getEmail(), request.getOtp()) ? "success" : "failed");
    }

    // FORGOT PASSWORD
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody SendOtpRequest request) {
        authService.sendForgotPasswordOtp(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "OTP sent to your registered email address."));
    }

    // RESET PASSWORD
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        authService.resetPassword(request);
        CookieUtil.deleteRefreshTokenCookie(httpRequest, httpResponse, cookieSecure, cookieSameSite);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully. Please sign in with your new password."));
    }

    // LOGOUT (Clears HttpOnly cookie & revokes token in DB)
    @RequestMapping(value = "/logout", method = {RequestMethod.POST, RequestMethod.GET})
    public ResponseEntity<?> logout(
            @RequestBody(required = false) RefreshTokenRequest requestBody,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String token = CookieUtil.getRefreshTokenFromCookie(httpRequest).orElse(null);

        if ((token == null || token.isBlank()) && requestBody != null) {
            token = requestBody.getRefreshToken();
        }

        if ((token == null || token.isBlank())) {
            token = httpRequest.getHeader("X-Refresh-Token");
        }

        if (token != null && !token.isBlank()) {
            authService.logout(token);
        }

        CookieUtil.deleteRefreshTokenCookie(httpRequest, httpResponse, cookieSecure, cookieSameSite);
        return ResponseEntity.ok(Map.of("message", "Logout successful"));
    }
}
