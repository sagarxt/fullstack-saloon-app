package com.groomish_now.backend.config;

import com.groomish_now.backend.enums.Gender;
import com.groomish_now.backend.enums.Role;
import com.groomish_now.backend.enums.Tier;
import com.groomish_now.backend.enums.*;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Component;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {

        // Ensure database check constraint on payments table supports ONLINE payment method
        try {
            jdbcTemplate.execute("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check");
            jdbcTemplate.execute("ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'ONLINE'))");
            System.out.println("✔ Successfully updated payments_payment_method_check constraint to include ONLINE.");
        } catch (Exception e) {
            System.err.println("Notice on payments_payment_method_check: " + e.getMessage());
        }

        // Check if ANY admin exists
        if (userRepository.findByRole(Role.ROLE_ADMIN).isEmpty()) {

            User admin = User.builder()
                    .name("Super Admin")
                    .email("admin@groomish.now")
                    .phone("9000080000")
                    .password(passwordEncoder.encode("admin"))
                    .role(Role.ROLE_ADMIN)
                    .gender(Gender.NOT_SPECIFIED)
                    .tier(Tier.SILVER)
                    .points(0)
                    .referralCode("ADMIN")
                    .active(true)
                    .createdBy(null)
                    .updatedBy(null)
                    .createdAt(LocalDateTime.now())
                    .lastLoginAt(null)
                    .dob(null)
                    .build();

            userRepository.save(admin);

            System.out.println("Default ADMIN created → email: admin@groomish.now  password: admin");

        } else {
            System.out.println("Admin already exists -> email: admin@groomish.now  password: admin");
        }
    }
}
