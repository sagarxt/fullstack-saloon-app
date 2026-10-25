package com.groomish_now.backend.service.admin;

import com.groomish_now.backend.dto.coupon.CouponRequest;
import com.groomish_now.backend.dto.coupon.CouponResponse;
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
