package com.loyalty_program_app.backend.controller.global;

import com.loyalty_program_app.backend.dto.coupon.CouponResponse;
import com.loyalty_program_app.backend.model.Coupon;
import com.loyalty_program_app.backend.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/public/coupons")
@RequiredArgsConstructor
public class PublicCouponController {

    private final CouponRepository couponRepository;

    @GetMapping
    public List<CouponResponse> getActiveCoupons() {
        LocalDateTime now = LocalDateTime.now();
        List<Coupon> activeCoupons = couponRepository.findAllByActiveTrue();

        return activeCoupons.stream()
                .filter(c -> (c.getStartDate() == null || !c.getStartDate().isAfter(now)) && (c.getExpiryDate() == null || !c.getExpiryDate().isBefore(now)))
                .map(c -> {
                    CouponResponse dto = new CouponResponse();
                    dto.setId(c.getId());
                    dto.setCode(c.getCode());
                    dto.setDescription(c.getDescription());
                    dto.setMinAmount(c.getMinAmount());
                    dto.setMaxDiscount(c.getMaxDiscount());
                    dto.setDiscount(c.getDiscount());
                    dto.setStartDate(c.getStartDate() != null ? c.getStartDate().toString() : null);
                    dto.setExpiryDate(c.getExpiryDate() != null ? c.getExpiryDate().toString() : null);
                    dto.setActive(c.isActive());
                    dto.setEligibleCategories(c.getEligibleCategories() != null ? new java.util.ArrayList<>(c.getEligibleCategories()) : new java.util.ArrayList<>());
                    dto.setApplicableUserGroups(c.getApplicableUserGroups() != null ? new java.util.ArrayList<>(c.getApplicableUserGroups()) : new java.util.ArrayList<>());
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
