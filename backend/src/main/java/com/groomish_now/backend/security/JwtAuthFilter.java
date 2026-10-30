package com.groomish_now.backend.security;

import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            try {
                Claims claims = tokenProvider.validateToken(token);

                UUID userId = UUID.fromString(claims.getSubject());
                String email = claims.get("email", String.class);
                String role = claims.get("role", String.class);

                // Check user existence, active status, and password change revocation
                User user = userRepository.findById(userId).orElse(null);
                if (user == null || !user.isActive()) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"User account inactive or not found\",\"code\":\"USER_INACTIVE\"}");
                    return;
                }

                if (user.getPasswordChangedAt() != null && claims.getIssuedAt() != null) {
                    long issuedAtMillis = claims.getIssuedAt().getTime();
                    long passwordChangedMillis = user.getPasswordChangedAt()
                            .atZone(ZoneId.systemDefault())
                            .toInstant()
                            .toEpochMilli();
                    // 1000ms grace window for clock precision
                    if (issuedAtMillis < (passwordChangedMillis - 1000)) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\":\"Password was changed. Please log in again.\",\"code\":\"PASSWORD_CHANGED\"}");
                        return;
                    }
                }

                request.setAttribute("userId", userId.toString());
                request.setAttribute("userEmail", email);

                CustomUserDetails userDetails =
                        new CustomUserDetails(
                                userId,
                                email,
                                null,
                                List.of(new SimpleGrantedAuthority(role))
                        );

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (ExpiredJwtException ex) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Access token expired\",\"code\":\"TOKEN_EXPIRED\"}");
                return;
            } catch (Exception ex) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Invalid or expired token\",\"code\":\"UNAUTHORIZED\"}");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
