package com.groomish_now.backend.controller.global;

import com.groomish_now.backend.dto.coupon.CouponResponse;
import com.groomish_now.backend.model.Coupon;
import com.groomish_now.backend.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
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
                    dto.setEligibleCategories(c.getEligibleCategories() != null ? new ArrayList<>(c.getEligibleCategories()) : new ArrayList<>());
                    dto.setApplicableUserGroups(c.getApplicableUserGroups() != null ? new ArrayList<>(c.getApplicableUserGroups()) : new ArrayList<>());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/validate")
    public CouponResponse validateCoupon(
            @RequestParam String code,
            @RequestParam(defaultValue = "0") Double cartAmount
    ) {
        if (code == null || code.trim().isEmpty()) {
            throw new RuntimeException("Coupon code is required");
        }

        Coupon c = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new RuntimeException("Invalid coupon code: " + code));

        if (!c.isActive()) {
            throw new RuntimeException("Coupon '" + c.getCode() + "' is currently inactive");
        }

        LocalDateTime now = LocalDateTime.now();
        if (c.getStartDate() != null && c.getStartDate().isAfter(now)) {
            throw new RuntimeException("Coupon not yet active. Valid from: " + c.getStartDate().toLocalDate());
        }

        if (c.getExpiryDate() != null && c.getExpiryDate().isBefore(now)) {
            throw new RuntimeException("Coupon expired on: " + c.getExpiryDate().toLocalDate());
        }

        if (c.getMinAmount() != null && cartAmount != null && cartAmount < c.getMinAmount()) {
            throw new RuntimeException("Minimum order total of ₹" + c.getMinAmount() + " required to apply this coupon");
        }

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
        dto.setEligibleCategories(c.getEligibleCategories() != null ? new ArrayList<>(c.getEligibleCategories()) : new ArrayList<>());
        dto.setApplicableUserGroups(c.getApplicableUserGroups() != null ? new ArrayList<>(c.getApplicableUserGroups()) : new ArrayList<>());
        return dto;
    }
}
