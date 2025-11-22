package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface ServiceRepository extends JpaRepository<ServiceEntity, UUID>, JpaSpecificationExecutor<ServiceEntity> {

    List<ServiceEntity> findTop3ByOrderByCreatedAtDesc();
}
