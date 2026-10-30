package com.groomish_now.backend.service.auth;

import com.groomish_now.backend.model.RefreshToken;
import com.groomish_now.backend.model.User;

import java.util.Optional;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(User user);
    Optional<RefreshToken> findByToken(String token);
    RefreshToken verifyExpiration(RefreshToken token);
    void revokeToken(String token);
    void revokeAllUserTokens(User user);
}
