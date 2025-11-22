package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByReferralCode(String code);

    List<User> findByRole(Role role);

    List<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContainingIgnoreCase(
            String name, String email, String phone
    );
    List<User> findByNameContainingIgnoreCase(String name);
    List<User> findByEmailContainingIgnoreCase(String email);
    List<User> findByPhoneContainingIgnoreCase(String phone);

    boolean existsByEmail(String email);
}
