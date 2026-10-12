package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreRepository extends JpaRepository<Store, UUID> {

    List<Store> findAllByActiveTrueOrderByCreatedAtAsc();

    Optional<Store> findFirstByActiveTrueOrderByCreatedAtAsc();

    Optional<Store> findByCode(String code);

    boolean existsByCode(String code);

    List<Store> findByCityIgnoreCaseAndActiveTrue(String city);
}
