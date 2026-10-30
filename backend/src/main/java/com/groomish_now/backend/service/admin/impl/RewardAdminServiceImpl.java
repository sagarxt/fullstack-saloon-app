package com.groomish_now.backend.service.admin.impl;

import com.groomish_now.backend.dto.reward.RewardRequest;
import com.groomish_now.backend.dto.reward.RewardResponse;
import com.groomish_now.backend.repository.ServiceRepository;
import com.groomish_now.backend.model.Reward;
import com.groomish_now.backend.repository.RewardRepository;
import com.groomish_now.backend.service.admin.RewardAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RewardAdminServiceImpl implements RewardAdminService {

    private final RewardRepository rewardRepository;
    private final ServiceRepository serviceRepository;
    private final com.groomish_now.backend.repository.ProductRepository productRepository;

    // =================== CREATE ===================
    @Override
    public RewardResponse createReward(RewardRequest request) {
        Reward r = new Reward();
        r.setTitle(request.getTitle());
        r.setImage(request.getImage());
        r.setDescription(request.getDescription());
        r.setPointsRequired(request.getPointsRequired());
        r.setStock(request.getStock());
        r.setActive(request.getActive() != null ? request.getActive() : true);

        if (request.getServiceId() != null) {
            r.setServiceId(request.getServiceId());
            serviceRepository.findById(request.getServiceId()).ifPresent(s -> r.setServiceName(s.getName()));
        } else if (request.getServiceName() != null) {
            r.setServiceName(request.getServiceName());
        }

        if (request.getProductId() != null) {
            r.setProductId(request.getProductId());
            productRepository.findById(request.getProductId()).ifPresent(p -> r.setProductName(p.getName()));
        } else if (request.getProductName() != null) {
            r.setProductName(request.getProductName());
        }

        r.setTargetType(request.getTargetType() != null && !request.getTargetType().isBlank() ? request.getTargetType().trim().toUpperCase() : "ALL");
        r.setConditionOperator(request.getConditionOperator() != null && !request.getConditionOperator().isBlank() ? request.getConditionOperator().trim().toUpperCase() : "OR");

        r.setDiscountPercent(request.getDiscountPercent() != null ? request.getDiscountPercent() : (request.getDiscountAmount() != null ? 0 : 100));
        r.setDiscountAmount(request.getDiscountAmount());
        r.setValidityDays(request.getValidityDays() != null ? request.getValidityDays() : 30);

        if (request.getEligibleCategories() != null) {
            r.setEligibleCategories(new java.util.ArrayList<>(request.getEligibleCategories()));
        }
        if (request.getEligibleBrands() != null) {
            r.setEligibleBrands(new java.util.ArrayList<>(request.getEligibleBrands()));
        }

        if (request.getExpiryDate() != null && !request.getExpiryDate().isBlank()) {
            r.setExpiryDate(parseDateSafely(request.getExpiryDate()));
        }

        rewardRepository.save(r);
        return toDto(r);
    }

    // =================== UPDATE ===================
    @Override
    public RewardResponse updateReward(UUID id, RewardRequest request) {
        Reward r = rewardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reward not found"));

        if (request.getTitle() != null) r.setTitle(request.getTitle());
        if (request.getImage() != null) r.setImage(request.getImage());
        if (request.getDescription() != null) r.setDescription(request.getDescription());
        if (request.getPointsRequired() != null) r.setPointsRequired(request.getPointsRequired());
        if (request.getStock() != null) r.setStock(request.getStock());
        if (request.getActive() != null) r.setActive(request.getActive());

        if (request.getServiceId() != null) {
            r.setServiceId(request.getServiceId());
            serviceRepository.findById(request.getServiceId()).ifPresent(s -> r.setServiceName(s.getName()));
        } else if (request.getServiceName() != null) {
            r.setServiceName(request.getServiceName());
        }

        if (request.getProductId() != null) {
            r.setProductId(request.getProductId());
            productRepository.findById(request.getProductId()).ifPresent(p -> r.setProductName(p.getName()));
        } else if (request.getProductName() != null) {
            r.setProductName(request.getProductName());
        }

        if (request.getTargetType() != null && !request.getTargetType().isBlank()) {
            r.setTargetType(request.getTargetType().trim().toUpperCase());
        }
        if (request.getConditionOperator() != null && !request.getConditionOperator().isBlank()) {
            r.setConditionOperator(request.getConditionOperator().trim().toUpperCase());
        }

        if (request.getDiscountPercent() != null) r.setDiscountPercent(request.getDiscountPercent());
        if (request.getDiscountAmount() != null) r.setDiscountAmount(request.getDiscountAmount());
        if (request.getValidityDays() != null) r.setValidityDays(request.getValidityDays());

        if (request.getEligibleCategories() != null) {
            r.setEligibleCategories(new java.util.ArrayList<>(request.getEligibleCategories()));
        }
        if (request.getEligibleBrands() != null) {
            r.setEligibleBrands(new java.util.ArrayList<>(request.getEligibleBrands()));
        }

        if (request.getExpiryDate() != null) {
            r.setExpiryDate(parseDateSafely(request.getExpiryDate()));
        }

        rewardRepository.save(r);
        return toDto(r);
    }

    private LocalDateTime parseDateSafely(String str) {
        if (str == null || str.trim().isEmpty()) return null;
        try {
            String trimmed = str.trim();
            if (trimmed.length() == 10) {
                return java.time.LocalDate.parse(trimmed).atTime(23, 59, 59);
            }
            return LocalDateTime.parse(trimmed);
        } catch (Exception e) {
            return null;
        }
    }

    // =================== SOFT DELETE ===================
    @Override
    public void softDeleteReward(UUID id) {
        Reward r = rewardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reward not found"));
        r.setActive(false);
        rewardRepository.save(r);
    }

    // =================== GET SINGLE ===================
    @Override
    public RewardResponse getReward(UUID id) {
        Reward r = rewardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reward not found"));
        return toDto(r);
    }

    // =================== SEARCH + FILTERS ===================
    @Override
    public Page<RewardResponse> searchRewards(
            String title,
            Boolean active,
            Integer minPoints,
            Integer maxPoints,
            Boolean inStock,
            Pageable pageable
    ) {
        List<Reward> all = rewardRepository.findAll();

        List<RewardResponse> filtered = all.stream()
                .filter(r -> title == null || r.getTitle().toLowerCase().contains(title.toLowerCase()))
                .filter(r -> active == null || r.isActive() == active)
                .filter(r -> minPoints == null || (r.getPointsRequired() != null && r.getPointsRequired() >= minPoints))
                .filter(r -> maxPoints == null || (r.getPointsRequired() != null && r.getPointsRequired() <= maxPoints))
                .filter(r -> inStock == null || (inStock ? r.getStock() != null && r.getStock() > 0 : true))
                .map(this::toDto)
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<RewardResponse> content = start > end ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(content, pageable, filtered.size());
    }

    // =================== MANUAL MAPPER ===================
    private RewardResponse toDto(Reward r) {
        RewardResponse dto = new RewardResponse();
        dto.setId(r.getId());
        dto.setTitle(r.getTitle());
        dto.setImage(r.getImage());
        dto.setDescription(r.getDescription());
        dto.setPointsRequired(r.getPointsRequired());
        dto.setStock(r.getStock());
        dto.setServiceId(r.getServiceId());
        dto.setServiceName(r.getServiceName());
        dto.setProductId(r.getProductId());
        dto.setProductName(r.getProductName());
        dto.setTargetType(r.getTargetType() != null ? r.getTargetType() : "ALL");
        dto.setConditionOperator(r.getConditionOperator() != null ? r.getConditionOperator() : "OR");
        dto.setDiscountPercent(r.getDiscountPercent());
        dto.setDiscountAmount(r.getDiscountAmount());
        dto.setValidityDays(r.getValidityDays());
        dto.setEligibleCategories(r.getEligibleCategories() != null ? new java.util.ArrayList<>(r.getEligibleCategories()) : new java.util.ArrayList<>());
        dto.setEligibleBrands(r.getEligibleBrands() != null ? new java.util.ArrayList<>(r.getEligibleBrands()) : new java.util.ArrayList<>());
        dto.setExpiryDate(r.getExpiryDate() != null ? r.getExpiryDate().toString() : null);
        dto.setActive(r.isActive());
        return dto;
    }
}
