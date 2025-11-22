package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.coupon.CouponRequest;
import com.loyalty_program_app.backend.dto.coupon.CouponResponse;
import com.loyalty_program_app.backend.model.Coupon;
import com.loyalty_program_app.backend.repository.CouponRepository;
import com.loyalty_program_app.backend.service.admin.CouponAdminService;
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

        if (couponRepository.findByCodeIgnoreCase(req.getCode()).isPresent()) {
            throw new RuntimeException("Coupon code already exists");
        }

        Coupon c = new Coupon();
        c.setCode(req.getCode());
        c.setDescription(req.getDescription());
        c.setMinAmount(req.getMinAmount());
        c.setMaxDiscount(req.getMaxDiscount());
        c.setDiscount(req.getDiscount());
        c.setExpiryDate(LocalDateTime.parse(req.getExpiryDate()));
        c.setActive(req.getActive() != null ? req.getActive() : true);

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

        if (req.getCode() != null) c.setCode(req.getCode());
        if (req.getDescription() != null) c.setDescription(req.getDescription());
        if (req.getMinAmount() != null) c.setMinAmount(req.getMinAmount());
        if (req.getMaxDiscount() != null) c.setMaxDiscount(req.getMaxDiscount());
        if (req.getDiscount() != null) c.setDiscount(req.getDiscount());
        if (req.getExpiryDate() != null)
            c.setExpiryDate(LocalDateTime.parse(req.getExpiryDate()));

        if (req.getActive() != null) c.setActive(req.getActive());

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

        if (c.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Coupon expired");
        }

        if (cartAmount < c.getMinAmount()) {
            throw new RuntimeException("Minimum cart amount required: " + c.getMinAmount());
        }

        return toDto(c);
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
        dto.setExpiryDate(c.getExpiryDate().toString());
        dto.setActive(c.isActive());
        return dto;
    }
}
