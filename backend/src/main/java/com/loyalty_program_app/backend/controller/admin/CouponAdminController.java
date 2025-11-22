package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.coupon.CouponRequest;
import com.loyalty_program_app.backend.dto.coupon.CouponResponse;
import com.loyalty_program_app.backend.service.admin.CouponAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/coupons")
@RequiredArgsConstructor
public class CouponAdminController {

    private final CouponAdminService couponAdminService;

    @PostMapping
    public CouponResponse createCoupon(@RequestBody CouponRequest request) {
        return couponAdminService.createCoupon(request);
    }

    @PutMapping("/{id}")
    public CouponResponse updateCoupon(
            @PathVariable UUID id,
            @RequestBody CouponRequest request
    ) {
        return couponAdminService.updateCoupon(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteCoupon(@PathVariable UUID id) {
        couponAdminService.softDeleteCoupon(id);
    }

    @GetMapping("/{id}")
    public CouponResponse getCoupon(@PathVariable UUID id) {
        return couponAdminService.getCoupon(id);
    }

    @GetMapping
    public Page<CouponResponse> searchCoupons(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return couponAdminService.searchCoupons(code, active, pageable);
    }

    @GetMapping("/validate")
    public CouponResponse validateCoupon(
            @RequestParam String code,
            @RequestParam Double cartAmount
    ) {
        return couponAdminService.validateCoupon(code, cartAmount);
    }
}
