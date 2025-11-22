package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Banner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BannerRepository extends JpaRepository<Banner, UUID> {
}
