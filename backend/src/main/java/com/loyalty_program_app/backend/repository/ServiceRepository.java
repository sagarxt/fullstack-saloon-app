package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServiceRepository extends JpaRepository<ServiceEntity, UUID> {

    List<ServiceEntity> findTop3ByOrderByCreatedAtDesc();
}
