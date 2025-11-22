package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
}
