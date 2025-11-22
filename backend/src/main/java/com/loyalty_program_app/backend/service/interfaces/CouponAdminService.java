package com.loyalty_program_app.backend.service.interfaces;

import com.loyalty_program_app.backend.dto.coupon.CouponRequest;
import com.loyalty_program_app.backend.dto.coupon.CouponResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CouponAdminService {

    CouponResponse createCoupon(CouponRequest request);

    CouponResponse updateCoupon(UUID id, CouponRequest request);

    void softDeleteCoupon(UUID id);

    CouponResponse getCoupon(UUID id);

    Page<CouponResponse> searchCoupons(String code, Boolean active, Pageable pageable);

    CouponResponse validateCoupon(String code, Double cartAmount);
}
