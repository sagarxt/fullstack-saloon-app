package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByActiveTrue();

    Page<Product> findByActiveTrue(Pageable pageable);

    List<Product> findByCategoryIgnoreCaseAndActiveTrue(String category);

    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Product> searchActiveProducts(@Param("q") String query);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.active = true AND p.category IS NOT NULL")
    List<String> findDistinctCategories();

    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.active = true AND p.brand IS NOT NULL AND TRIM(p.brand) != ''")
    List<String> findDistinctBrands();

    List<Product> findByBrandIgnoreCaseAndActiveTrue(String brand);

    List<Product> findByBrandIgnoreCase(String brand);

    long countByBrandIgnoreCase(String brand);

    long countByCategoryIgnoreCase(String category);

    List<Product> findByCategoryIgnoreCase(String category);
}
