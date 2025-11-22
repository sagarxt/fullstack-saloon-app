package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.points.PointsLedgerRequest;
import com.loyalty_program_app.backend.dto.points.PointsLedgerResponse;
import com.loyalty_program_app.backend.enums.PointReason;
import com.loyalty_program_app.backend.model.PointsLedger;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.PointsLedgerRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.interfaces.PointsLedgerAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PointsLedgerAdminServiceImpl implements PointsLedgerAdminService {

    private final PointsLedgerRepository ledgerRepository;
    private final UserRepository userRepository;

    // ================= SEARCH =================
    @Override
    public Page<PointsLedgerResponse> searchLedger(
            String userName,
            String reason,
            String fromDate,
            String toDate,
            Pageable pageable
    ) {
        List<PointsLedger> all = ledgerRepository.findAll();

        List<PointsLedgerResponse> filtered = all.stream()
                .filter(l -> userName == null ||
                        l.getUser().getName().toLowerCase().contains(userName.toLowerCase()))
                .filter(l -> reason == null || l.getReason().name().equalsIgnoreCase(reason))
                .filter(l -> {
                    if (fromDate == null) return true;
                    LocalDateTime start = parseDate(fromDate).atStartOfDay();
                    return l.getCreatedAt().isAfter(start);
                })
                .filter(l -> {
                    if (toDate == null) return true;
                    LocalDateTime end = parseDate(toDate).atTime(23, 59, 59);
                    return l.getCreatedAt().isBefore(end);
                })
                .map(this::toDto)
                .collect(Collectors.toList());

        // Pagination manually
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<PointsLedgerResponse> content = start > end ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(content, pageable, filtered.size());
    }

    // ================= MANUAL ADJUST =================
    @Override
    public PointsLedgerResponse manualAdjust(PointsLedgerRequest request) {

        UUID userId = UUID.fromString(request.getUserId());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int amount = request.getChangeAmount();
        user.setPoints(user.getPoints() + amount); // update total points

        userRepository.save(user);

        // create ledger entry
        PointsLedger ledger = new PointsLedger();
        ledger.setUser(user);
        ledger.setChangeAmount(amount);
        ledger.setReason(PointReason.ADMIN_ADJUST);
        ledger.setCreatedAt(LocalDateTime.now());

        ledgerRepository.save(ledger);

        return toDto(ledger);
    }

    // ================= UTIL =================
    private LocalDate parseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr); // yyyy-MM-dd
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format: " + dateStr);
        }
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
