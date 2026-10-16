package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.enums.PolicyFaqType;
import com.loyalty_program_app.backend.model.PolicyFaqItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PolicyFaqRepository extends JpaRepository<PolicyFaqItem, UUID> {

    List<PolicyFaqItem> findByTypeAndActiveTrueOrderByDisplayOrderAscCreatedAtAsc(PolicyFaqType type);

    List<PolicyFaqItem> findByTypeOrderByDisplayOrderAscCreatedAtAsc(PolicyFaqType type);

    List<PolicyFaqItem> findByTypeAndCategoryAndActiveTrueOrderByDisplayOrderAscCreatedAtAsc(PolicyFaqType type, String category);

    List<PolicyFaqItem> findAllByOrderByTypeAscDisplayOrderAscCreatedAtAsc();
}
