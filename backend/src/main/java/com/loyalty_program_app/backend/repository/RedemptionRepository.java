package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Redemption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RedemptionRepository extends JpaRepository<Redemption, UUID> {}
