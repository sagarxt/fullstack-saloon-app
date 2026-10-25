package com.groomish_now.backend.service.policyfaq.impl;

import com.groomish_now.backend.dto.policyfaq.PolicyFaqRequest;
import com.groomish_now.backend.dto.policyfaq.PolicyFaqResponse;
import com.groomish_now.backend.enums.PolicyFaqType;
import com.groomish_now.backend.model.PolicyFaqItem;
import com.groomish_now.backend.repository.PolicyFaqRepository;
import com.groomish_now.backend.service.policyfaq.PolicyFaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PolicyFaqServiceImpl implements PolicyFaqService {

    private final PolicyFaqRepository policyFaqRepository;

    @Override
    public List<PolicyFaqResponse> getPublicItems(PolicyFaqType type) {
        List<PolicyFaqItem> items;
        if (type != null) {
            items = policyFaqRepository.findByTypeAndActiveTrueOrderByDisplayOrderAscCreatedAtAsc(type);
        } else {
            items = policyFaqRepository.findAllByOrderByTypeAscDisplayOrderAscCreatedAtAsc()
                    .stream()
                    .filter(PolicyFaqItem::isActive)
                    .collect(Collectors.toList());
        }
        return items.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<PolicyFaqResponse> getAllItemsForAdmin(PolicyFaqType type) {
        List<PolicyFaqItem> items;
        if (type != null) {
            items = policyFaqRepository.findByTypeOrderByDisplayOrderAscCreatedAtAsc(type);
        } else {
            items = policyFaqRepository.findAllByOrderByTypeAscDisplayOrderAscCreatedAtAsc();
        }
        return items.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public PolicyFaqResponse getItemById(UUID id) {
        PolicyFaqItem item = policyFaqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Content section not found with ID: " + id));
        return toDto(item);
    }

    @Override
    @Transactional
    public PolicyFaqResponse createItem(PolicyFaqRequest request) {
        if (request.getType() == null) {
            throw new IllegalArgumentException("Type (POLICY or QA) is required");
        }
        if (request.getHeading() == null || request.getHeading().trim().isEmpty()) {
            throw new IllegalArgumentException("Heading is required");
        }
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Description is required");
        }

        PolicyFaqItem item = PolicyFaqItem.builder()
                .type(request.getType())
                .category(request.getCategory() != null ? request.getCategory().trim().toUpperCase() : "GENERAL")
                .heading(request.getHeading().trim())
                .description(request.getDescription().trim())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        item = policyFaqRepository.save(item);
        return toDto(item);
    }

    @Override
    @Transactional
    public PolicyFaqResponse updateItem(UUID id, PolicyFaqRequest request) {
        PolicyFaqItem item = policyFaqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Content section not found with ID: " + id));

        if (request.getType() != null) {
            item.setType(request.getType());
        }
        if (request.getCategory() != null && !request.getCategory().trim().isEmpty()) {
            item.setCategory(request.getCategory().trim().toUpperCase());
        }
        if (request.getHeading() != null && !request.getHeading().trim().isEmpty()) {
            item.setHeading(request.getHeading().trim());
        }
        if (request.getDescription() != null && !request.getDescription().trim().isEmpty()) {
            item.setDescription(request.getDescription().trim());
        }
        if (request.getDisplayOrder() != null) {
            item.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getActive() != null) {
            item.setActive(request.getActive());
        }

        item = policyFaqRepository.save(item);
        return toDto(item);
    }

    @Override
    @Transactional
    public PolicyFaqResponse toggleItemStatus(UUID id) {
        PolicyFaqItem item = policyFaqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Content section not found with ID: " + id));
        item.setActive(!item.isActive());
        item = policyFaqRepository.save(item);
        return toDto(item);
    }

    @Override
    @Transactional
    public void forceDeleteItem(UUID id) {
        PolicyFaqItem item = policyFaqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Content section not found with ID: " + id));
        policyFaqRepository.delete(item);
    }

    private PolicyFaqResponse toDto(PolicyFaqItem item) {
        return PolicyFaqResponse.builder()
                .id(item.getId())
                .type(item.getType() != null ? item.getType().name() : "")
                .category(item.getCategory())
                .heading(item.getHeading())
                .description(item.getDescription())
                .displayOrder(item.getDisplayOrder())
                .active(item.isActive())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
