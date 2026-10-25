package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.Banner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BannerRepository extends JpaRepository<Banner, UUID> {
    List<Banner> findByActiveTrueOrderByCreatedAtDesc();
}
