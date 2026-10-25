package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    Optional<Coupon> findByCodeIgnoreCase(String code);
    Optional<Coupon> findByCodeAndActiveTrue(String code);
    java.util.List<Coupon> findAllByActiveTrue();
}
