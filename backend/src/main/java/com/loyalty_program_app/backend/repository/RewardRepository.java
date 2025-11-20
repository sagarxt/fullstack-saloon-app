package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Reward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RewardRepository extends JpaRepository<Reward, UUID> {
    List<Reward> findByActiveTrue();
}
