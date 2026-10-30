package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.Cohort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CohortRepository extends JpaRepository<Cohort, UUID> {

    Optional<Cohort> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<Cohort> findByActiveTrueOrderByCreatedAtAsc();

    List<Cohort> findAllByOrderByCreatedAtAsc();
}
