package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {

    Optional<ProductCategory> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<ProductCategory> findAllByOrderByCreatedAtDesc();

    List<ProductCategory> findByActiveTrueOrderByNameAsc();
}
