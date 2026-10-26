package com.groomish_now.backend.service.customer.impl;

import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.enums.Tier;
import com.groomish_now.backend.repository.BookingRepository;
import com.groomish_now.backend.dto.points.PointsBalanceResponse;
import com.groomish_now.backend.dto.points.PointsLedgerResponse;
import com.groomish_now.backend.repository.RedeemedVoucherRepository;
import com.groomish_now.backend.model.PointsLedger;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.PointsLedgerRepository;
import com.groomish_now.backend.repository.UserRepository;
import com.groomish_now.backend.service.customer.CustomerPointsService;
import com.groomish_now.backend.util.ReferralCodeGenerator;
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
    private final BookingRepository bookingRepository;
    private final RedeemedVoucherRepository redeemedVoucherRepository;
    private final com.groomish_now.backend.service.loyalty.LoyaltyConfigService loyaltyConfigService;

    @Override
    public PointsBalanceResponse getBalance(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        var userBookings = bookingRepository.findByUserId(userId);
        int pending = 0;
        double multiplier = 1.0;
        if (user.getTier() != null) {
            switch (user.getTier()) {
                case DIAMOND -> multiplier = 2.0;
                case PLATINUM -> multiplier = 1.5;
                case GOLD -> multiplier = 1.25;
                case SILVER -> multiplier = 1.0;
            }
        }
        if (userBookings != null) {
            for (var b : userBookings) {
                if (b.getStatus() == BookingStatus.PENDING ||
                    b.getStatus() == BookingStatus.CONFIRMED ||
                    b.getStatus() == BookingStatus.MODIFIED) {
                    double pAmount = b.getPricePaid() != null ? b.getPricePaid() : (b.getTotalAmount() != null ? b.getTotalAmount() : 0.0);
                    pending += Math.max(1, (int) Math.round((pAmount / 100.0) * multiplier));
                }
            }
        }

        int lifetime = user.getLifetimePoints() != null && user.getLifetimePoints() > 0
                ? user.getLifetimePoints()
                : (user.getPoints() != null ? user.getPoints() : 0);

        // Keep tier updated with lifetime points according to Admin-configured ranges (tiers NEVER downgrade on redemption or config adjustment)
        Tier calculatedTier = loyaltyConfigService.calculateTier(lifetime, user.getTier());

        if (user.getTier() == null || calculatedTier.ordinal() > user.getTier().ordinal()) {
            user.setTier(calculatedTier);
            user.setLifetimePoints(lifetime);
            userRepository.save(user);
        }


        // Guarantee user has a unique referral code
        if (user.getReferralCode() == null || user.getReferralCode().isBlank()) {
            user.setReferralCode(ReferralCodeGenerator.generateUniqueReferralCode(user.getName(), userRepository));
            userRepository.save(user);
        }

        PointsBalanceResponse dto = new PointsBalanceResponse();
        dto.setPoints(user.getPoints() != null ? user.getPoints() : 0);
        dto.setLifetimePoints(lifetime);
        dto.setTier(user.getTier() != null ? user.getTier().name() : calculatedTier.name());
        dto.setPendingPoints(pending);
        dto.setReferralCode(user.getReferralCode());
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
        if (l.getUser() != null) {
            dto.setUserId(l.getUser().getId());
            dto.setUserName(l.getUser().getName());
        }
        dto.setChangeAmount(l.getChangeAmount());
        dto.setReason(l.getReason() != null ? l.getReason().name() : null);
        dto.setNote(l.getNote());
        dto.setRelatedId(l.getRelatedId());
        dto.setCreatedAt(l.getCreatedAt() != null ? l.getCreatedAt().toString() : null);

        if (l.getRelatedId() != null) {
            var optBooking = bookingRepository.findById(l.getRelatedId());
            if (optBooking.isPresent()) {
                var b = optBooking.get();
                dto.setBookingId(b.getId());
                dto.setBookingCode(b.getBookingCode());
                dto.setOrderAmount(b.getPricePaid() != null ? b.getPricePaid() : b.getTotalAmount());
                if (b.getBookingItems() != null && !b.getBookingItems().isEmpty()) {
                    String services = b.getBookingItems().stream()
                            .map(item -> item.getServiceNameSnapshot() != null ? item.getServiceNameSnapshot() : (item.getService() != null ? item.getService().getName() : "Salon Service"))
                            .reduce((a, s) -> a + ", " + s).orElse("Salon Service");
                    dto.setServiceName(services);
                }
            } else {
                var optVoucher = redeemedVoucherRepository.findById(l.getRelatedId());
                if (optVoucher.isPresent()) {
                    var v = optVoucher.get();
                    dto.setVoucherCode(v.getVoucherCode());
                    dto.setVoucherTitle(v.getTitle());
                    dto.setServiceName(v.getServiceName());
                } else {
                    var optUser = userRepository.findById(l.getRelatedId());
                    if (optUser.isPresent()) {
                        var u = optUser.get();
                        dto.setServiceName("Friend Referral: " + u.getName());
                        if (dto.getNote() == null || dto.getNote().isBlank()) {
                            dto.setNote("Referred to " + u.getName());
                        }
                    }
                }
            }
        }
        return dto;
    }
}
