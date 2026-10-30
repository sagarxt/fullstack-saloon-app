package com.groomish_now.backend.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

import java.util.Arrays;
import java.util.Optional;

public class CookieUtil {

    public static final String REFRESH_TOKEN_COOKIE = "refreshToken";

    public static void createRefreshTokenCookie(
            HttpServletRequest request,
            HttpServletResponse response,
            String token,
            long maxAgeSeconds,
            boolean forceSecure,
            String forcedSameSite
    ) {
        boolean isSecure = forceSecure || (request != null && (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"))));
        String sameSite = (forcedSameSite != null && !forcedSameSite.isBlank())
                ? forcedSameSite
                : (isSecure ? "None" : "Lax");

        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(isSecure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public static void deleteRefreshTokenCookie(
            HttpServletRequest request,
            HttpServletResponse response,
            boolean forceSecure,
            String forcedSameSite
    ) {
        boolean isSecure = forceSecure || (request != null && (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"))));
        String sameSite = (forcedSameSite != null && !forcedSameSite.isBlank())
                ? forcedSameSite
                : (isSecure ? "None" : "Lax");

        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(isSecure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public static Optional<String> getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request == null || request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_TOKEN_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .filter(v -> v != null && !v.isBlank())
                .findFirst();
    }
}
