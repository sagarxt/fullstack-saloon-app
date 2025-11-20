package com.loyalty_program_app.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

public class AuthDtos {

    @Data
    public static class RegisterRequest {
        @NotBlank private String name;
        @Email private String email;
        private String phone;
        @NotBlank private String password;
        private String referralCode;
    }

    @Data
    public static class LoginRequest {
        @Email private String email;
        @NotBlank private String password;
    }

    @Data
    public static class AuthResponse {
        private String accessToken;
        private String tokenType = "Bearer";
        private UUID userId;
        private String email;
        private String name;
    }
}
