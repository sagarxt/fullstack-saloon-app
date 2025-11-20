package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.model.PointsLedger;
import com.loyalty_program_app.backend.repository.*;
import org.springframework.web.bind.annotation.*;
import lombok.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PointsLedgerRepository pointsLedgerRepository;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {

        long countCustomers = userRepository.count();
        long countBookings = bookingRepository.count();

        long totalPointsIssued = pointsLedgerRepository
                .findAll()
                .stream()
                .filter(x -> x.getChangeAmount() > 0)
                .mapToInt(PointsLedger::getChangeAmount)
                .sum();

        long pendingRewards = 0; // later implement reward requests table

        return Map.of(
                "customers", countCustomers,
                "bookings", countBookings,
                "pointsIssued", totalPointsIssued,
                "pendingRewards", pendingRewards
        );
    }
}
