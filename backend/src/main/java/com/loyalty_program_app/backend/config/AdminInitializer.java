package com.loyalty_program_app.backend.config;

import com.loyalty_program_app.backend.enums.UserRole;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AdminInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public void run(String... args) throws Exception {

        if (userRepository.findByRole((UserRole.ROLE_ADMIN)).isEmpty()) {

            User admin = User.builder()
                    .name("Super Admin")
                    .email("admin@loyaltyapp.com")
                    .phone("9999999999")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(UserRole.ROLE_ADMIN)
                    .points(0)
                    .createdAt(Instant.now())
                    .referralCode("ADMIN")
                    .active(true)
                    .build();

            userRepository.save(admin);
            System.out.println("✔ Default Admin created: admin@loyaltyapp.com / admin123");
        } else {
            System.out.println("✔ Admin user already exists. Skipping creation.");
        }
    }
}
