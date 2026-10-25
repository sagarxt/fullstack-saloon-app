package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.Referral;
import com.groomish_now.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReferralRepository extends JpaRepository<Referral, UUID> {
    Page<Referral> findByReferrer(User referrer, Pageable pageable);

    long countByReferrerId(UUID referrerId);

    long countByReferrerIdAndRewardGivenTrue(UUID referrerId);
}
