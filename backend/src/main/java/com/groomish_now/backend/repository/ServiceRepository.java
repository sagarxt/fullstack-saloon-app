package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface ServiceRepository extends JpaRepository<ServiceEntity, UUID>, JpaSpecificationExecutor<ServiceEntity> {

    List<ServiceEntity> findByActiveTrue();

    List<ServiceEntity> findTop6ByActiveTrueOrderByCreatedAtDesc();

    List<ServiceEntity> findByCategoryId(UUID categoryId);

}
