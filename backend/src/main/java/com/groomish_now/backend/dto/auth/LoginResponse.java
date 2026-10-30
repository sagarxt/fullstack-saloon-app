package com.groomish_now.backend.dto.auth;

import com.groomish_now.backend.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token; // For backward compatibility
    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private UserResponse user;

    public LoginResponse(String token, UserResponse user) {
        this.token = token;
        this.accessToken = token;
        this.user = user;
    }
}
