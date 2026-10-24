package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BrandRepository extends JpaRepository<Brand, UUID> {

    Optional<Brand> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    List<Brand> findAllByOrderByCreatedAtDesc();

    List<Brand> findByActiveTrueOrderByNameAsc();
}
