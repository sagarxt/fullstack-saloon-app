package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.enums.PointsReason;
import com.loyalty_program_app.backend.model.PointsLedger;
import com.loyalty_program_app.backend.repository.PointsLedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PointsService {

    private final PointsLedgerRepository ledgerRepo;

    /** Total balance = sum(changeAmount) */
    public int getBalance(UUID userId) {
        return ledgerRepo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .mapToInt(entry -> entry.getChangeAmount() == null ? 0 : entry.getChangeAmount())
                .sum();
    }

    /** Add points (positive or negative) */
    public void addEntry(UUID userId, int amount, PointsReason reason, UUID relatedId) {
        PointsLedger entry = PointsLedger.builder()
                .userId(userId)
                .changeAmount(amount)
                .reason(reason)
                .relatedId(relatedId)
                .build();

        ledgerRepo.save(entry);
    }

    /** Fetch ledger list */
    public java.util.List<PointsLedger> getLedger(UUID userId) {
        return ledgerRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
