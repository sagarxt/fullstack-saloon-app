package com.groomish_now.backend.service.admin.impl;

import com.groomish_now.backend.dto.coupon.CouponRequest;
import com.groomish_now.backend.dto.coupon.CouponResponse;
import com.groomish_now.backend.model.Coupon;
import com.groomish_now.backend.repository.CouponRepository;
import com.groomish_now.backend.service.admin.CouponAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CouponAdminServiceImpl implements CouponAdminService {

    private final CouponRepository couponRepository;

    // ======================================
    // CREATE COUPON
    // ======================================
    @Override
    public CouponResponse createCoupon(CouponRequest req) {

        if (req.getCode() == null || req.getCode().trim().isEmpty()) {
            throw new RuntimeException("Coupon code is required");
        }
        String cleanCode = req.getCode().trim().toUpperCase();
        if (cleanCode.length() > 25) {
            throw new RuntimeException("Coupon code cannot exceed 25 characters");
        }

        if (couponRepository.findByCodeIgnoreCase(cleanCode).isPresent()) {
            throw new RuntimeException("Coupon code already exists");
        }

        Coupon c = new Coupon();
        c.setCode(cleanCode);
        c.setDescription(req.getDescription());
        c.setMinAmount(req.getMinAmount());
        c.setMaxDiscount(req.getMaxDiscount());
        c.setDiscount(req.getDiscount());
        c.setStartDate(parseDate(req.getStartDate()));
        c.setExpiryDate(parseExpiryDate(req.getExpiryDate()));
        c.setActive(req.getActive() != null ? req.getActive() : true);
        if (req.getEligibleCategories() != null) {
            c.setEligibleCategories(new java.util.ArrayList<>(req.getEligibleCategories()));
        }
        if (req.getApplicableUserGroups() != null) {
            c.setApplicableUserGroups(new java.util.ArrayList<>(req.getApplicableUserGroups()));
        }

        couponRepository.save(c);
        return toDto(c);
    }

    // ======================================
    // UPDATE COUPON
    // ======================================
    @Override
    public CouponResponse updateCoupon(UUID id, CouponRequest req) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        if (req.getCode() != null) {
            String cleanCode = req.getCode().trim().toUpperCase();
            if (cleanCode.length() > 25) {
                throw new RuntimeException("Coupon code cannot exceed 25 characters");
            }
            c.setCode(cleanCode);
        }
        if (req.getDescription() != null) c.setDescription(req.getDescription());
        if (req.getMinAmount() != null) c.setMinAmount(req.getMinAmount());
        if (req.getMaxDiscount() != null) c.setMaxDiscount(req.getMaxDiscount());
        if (req.getDiscount() != null) c.setDiscount(req.getDiscount());
        if (req.getStartDate() != null)
            c.setStartDate(parseDate(req.getStartDate()));
        if (req.getExpiryDate() != null)
            c.setExpiryDate(parseExpiryDate(req.getExpiryDate()));

        if (req.getActive() != null) c.setActive(req.getActive());
        if (req.getEligibleCategories() != null) {
            c.setEligibleCategories(new java.util.ArrayList<>(req.getEligibleCategories()));
        }
        if (req.getApplicableUserGroups() != null) {
            c.setApplicableUserGroups(new java.util.ArrayList<>(req.getApplicableUserGroups()));
        }

        couponRepository.save(c);
        return toDto(c);
    }

    // ======================================
    // SOFT DELETE
    // ======================================
    @Override
    public void softDeleteCoupon(UUID id) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        c.setActive(false);
        couponRepository.save(c);
    }

    // ======================================
    // GET SINGLE COUPON
    // ======================================
    @Override
    public CouponResponse getCoupon(UUID id) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
        return toDto(c);
    }

    // ======================================
    // SEARCH COUPONS
    // ======================================
    @Override
    public Page<CouponResponse> searchCoupons(String code, Boolean active, Pageable pageable) {

        List<Coupon> all = couponRepository.findAll();

        List<CouponResponse> filtered = all.stream()
                .filter(c -> code == null || c.getCode().toLowerCase().contains(code.toLowerCase()))
                .filter(c -> active == null || c.isActive() == active)
                .map(this::toDto)
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<CouponResponse> content = start > end ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(content, pageable, filtered.size());
    }

    // ======================================
    // VALIDATE COUPON
    // ======================================
    @Override
    public CouponResponse validateCoupon(String code, Double cartAmount) {

        Coupon c = couponRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        if (!c.isActive()) {
            throw new RuntimeException("Coupon is inactive");
        }

        if (c.getStartDate() != null && c.getStartDate().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Coupon not yet active. Valid from: " + c.getStartDate().toLocalDate());
        }

        if (c.getExpiryDate() != null && c.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Coupon expired on: " + c.getExpiryDate().toLocalDate());
        }

        if (cartAmount < c.getMinAmount()) {
            throw new RuntimeException("Minimum cart amount required: " + c.getMinAmount());
        }

        return toDto(c);
    }

    private LocalDateTime parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            if (dateStr.length() == 10) {
                return java.time.LocalDate.parse(dateStr).atStartOfDay();
            }
            if (dateStr.endsWith("Z") || dateStr.contains("+")) {
                return java.time.OffsetDateTime.parse(dateStr).toLocalDateTime();
            }
            return LocalDateTime.parse(dateStr);
        } catch (Exception e) {
            try {
                return java.time.Instant.parse(dateStr).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
            } catch (Exception ex) {
                return LocalDateTime.parse(dateStr.substring(0, 19));
            }
        }
    }

    private LocalDateTime parseExpiryDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDateTime.now().plusDays(90);
        try {
            if (dateStr.length() == 10) {
                return java.time.LocalDate.parse(dateStr).atTime(23, 59, 59);
            }
            if (dateStr.endsWith("Z") || dateStr.contains("+")) {
                return java.time.OffsetDateTime.parse(dateStr).toLocalDateTime();
            }
            return LocalDateTime.parse(dateStr);
        } catch (Exception e) {
            try {
                return java.time.Instant.parse(dateStr).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
            } catch (Exception ex) {
                return LocalDateTime.parse(dateStr.substring(0, 19));
            }
        }
    }

    // ======================================
    // MANUAL MAPPER
    // ======================================
    private CouponResponse toDto(Coupon c) {
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
    }
}
