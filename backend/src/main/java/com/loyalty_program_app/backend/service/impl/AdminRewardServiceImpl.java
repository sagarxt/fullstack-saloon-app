package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.reward.RewardRequest;
import com.loyalty_program_app.backend.dto.reward.RewardResponse;
import com.loyalty_program_app.backend.model.Reward;
import com.loyalty_program_app.backend.repository.RewardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminRewardServiceImpl {

    private final RewardRepository rewardRepo;

    public List<RewardResponse> getAll() {
        return rewardRepo.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public RewardResponse getById(UUID id) {
        Reward r = rewardRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Reward not found"));

        return toResponse(r);
    }

    public RewardResponse create(RewardRequest dto) {
        Reward r = Reward.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .pointsRequired(dto.getPointsRequired())
                .active(dto.getActive())
                .build();

        rewardRepo.save(r);
        return toResponse(r);
    }

    public RewardResponse update(UUID id, RewardRequest dto) {
        Reward r = rewardRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Reward not found"));

        r.setTitle(dto.getTitle());
        r.setDescription(dto.getDescription());
        r.setPointsRequired(dto.getPointsRequired());
        r.setActive(dto.getActive());

        rewardRepo.save(r);
        return toResponse(r);
    }

    public void delete(UUID id) {
        if (!rewardRepo.existsById(id)) {
            throw new RuntimeException("Reward not found");
        }
        rewardRepo.deleteById(id);
    }

    private RewardResponse toResponse(Reward r) {
        return RewardResponse.builder()
                .id(r.getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .pointsRequired(r.getPointsRequired())
                .active(r.getActive())
                .build();
    }
}
