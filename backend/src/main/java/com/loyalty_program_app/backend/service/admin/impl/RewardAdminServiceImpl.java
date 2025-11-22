package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.reward.RewardRequest;
import com.loyalty_program_app.backend.dto.reward.RewardResponse;
import com.loyalty_program_app.backend.model.Reward;
import com.loyalty_program_app.backend.repository.RewardRepository;
import com.loyalty_program_app.backend.service.admin.RewardAdminService;
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

        if (request.getExpiryDate() != null) {
            r.setExpiryDate(LocalDateTime.parse(request.getExpiryDate()));
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
        if (request.getExpiryDate() != null) {
            r.setExpiryDate(LocalDateTime.parse(request.getExpiryDate()));
        }

        rewardRepository.save(r);
        return toDto(r);
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
        dto.setExpiryDate(r.getExpiryDate() != null ? r.getExpiryDate().toString() : null);
        dto.setActive(r.isActive());
        return dto;
    }
}
