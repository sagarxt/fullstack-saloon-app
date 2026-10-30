package com.groomish_now.backend.service.auth.impl;

import com.groomish_now.backend.model.RefreshToken;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.RefreshTokenRepository;
import com.groomish_now.backend.security.JwtTokenProvider;
import com.groomish_now.backend.service.auth.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(jwtTokenProvider.getRefreshExpirationMs()))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Override
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            throw new RuntimeException("Refresh token was expired. Please make a new login request.");
        }
        if (token.isRevoked()) {
            throw new RuntimeException("Refresh token was revoked. Please make a new login request.");
        }
        return token;
    }

    @Override
    @Transactional
    public void revokeToken(String token) {
        if (token != null && !token.isBlank()) {
            refreshTokenRepository.findByToken(token).ifPresent(rt -> {
                rt.setRevoked(true);
                refreshTokenRepository.save(rt);
            });
        }
    }

    @Override
    @Transactional
    public void revokeAllUserTokens(User user) {
        if (user != null) {
            refreshTokenRepository.revokeAllByUser(user);
        }
    }
}
