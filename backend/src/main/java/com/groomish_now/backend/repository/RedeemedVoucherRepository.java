package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.RedeemedVoucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RedeemedVoucherRepository extends JpaRepository<RedeemedVoucher, UUID> {

    List<RedeemedVoucher> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<RedeemedVoucher> findByVoucherCode(String voucherCode);

    long countByUserId(UUID userId);
}
