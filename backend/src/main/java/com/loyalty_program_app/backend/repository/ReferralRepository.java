package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Referral;
import com.loyalty_program_app.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReferralRepository extends JpaRepository<Referral, UUID> {
    Page<Referral> findByReferrer(User referrer, Pageable pageable);
}
