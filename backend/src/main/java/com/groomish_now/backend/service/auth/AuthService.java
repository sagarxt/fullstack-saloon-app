package com.groomish_now.backend.service.auth;

import com.groomish_now.backend.dto.auth.LoginRequest;
import com.groomish_now.backend.dto.auth.LoginResponse;
import com.groomish_now.backend.dto.auth.RefreshTokenResponse;
import com.groomish_now.backend.dto.auth.RegisterRequest;
import com.groomish_now.backend.dto.auth.ResetPasswordRequest;
import com.groomish_now.backend.dto.user.UserResponse;
import com.groomish_now.backend.enums.Role;

import java.util.Map;

public interface AuthService {
    Map<String, Object> verifyReferralCode(String code);
    UserResponse registerCustomer(RegisterRequest request);
    UserResponse registerByAdmin(RegisterRequest request, Role role);
    LoginResponse login(LoginRequest request);
    RefreshTokenResponse refreshToken(String refreshToken);
    void logout(String refreshToken);
    long getRefreshExpirationSeconds();
    void sendForgotPasswordOtp(String email);
    void resetPassword(ResetPasswordRequest request);
}
