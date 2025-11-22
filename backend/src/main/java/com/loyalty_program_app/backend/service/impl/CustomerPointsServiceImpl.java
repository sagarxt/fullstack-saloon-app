package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.points.PointsBalanceResponse;
import com.loyalty_program_app.backend.dto.points.PointsLedgerResponse;
import com.loyalty_program_app.backend.model.PointsLedger;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.PointsLedgerRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.interfaces.CustomerPointsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerPointsServiceImpl implements CustomerPointsService {

    private final UserRepository userRepository;
    private final PointsLedgerRepository pointsLedgerRepository;

    @Override
    public PointsBalanceResponse getBalance(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PointsBalanceResponse dto = new PointsBalanceResponse();
        dto.setPoints(user.getPoints());
        dto.setTier(user.getTier().name());
        return dto;
    }

    @Override
    public Page<PointsLedgerResponse> getHistory(UUID userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Page<PointsLedger> page = pointsLedgerRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        return page.map(this::toDto);
    }

    private PointsLedgerResponse toDto(PointsLedger l) {
        PointsLedgerResponse dto = new PointsLedgerResponse();
        dto.setId(l.getId());
        dto.setUserId(l.getUser().getId());
        dto.setUserName(l.getUser().getName());
        dto.setChangeAmount(l.getChangeAmount());
        dto.setReason(l.getReason().name());
        dto.setCreatedAt(l.getCreatedAt().toString());
        return dto;
    }
}
