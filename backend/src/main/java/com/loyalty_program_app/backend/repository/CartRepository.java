package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CartRepository extends JpaRepository<Cart, UUID> {
    Optional<Cart> findByUserId(UUID userId);

    @Query("SELECT c FROM Cart c WHERE c.user.email = :email")
    Optional<Cart> findByUserEmail(@Param("email") String email);

    boolean existsByUserId(UUID userId);
}
