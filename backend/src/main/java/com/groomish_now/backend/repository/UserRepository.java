package com.groomish_now.backend.repository;

import com.groomish_now.backend.enums.Role;
import com.groomish_now.backend.model.User;
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

    long countByCreatedBy(UUID createdBy);
}
