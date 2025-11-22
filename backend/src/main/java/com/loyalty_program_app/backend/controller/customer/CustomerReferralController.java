package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.referral.ReferralCodeResponse;
import com.loyalty_program_app.backend.dto.referral.ReferralResponse;
import com.loyalty_program_app.backend.service.customer.CustomerReferralService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/referrals")
@RequiredArgsConstructor
public class CustomerReferralController {

    private final CustomerReferralService referralService;

    private UUID getCurrentUserId(HttpServletRequest request) {
        return UUID.fromString((String) request.getAttribute("userId"));
    }

    @GetMapping("/code")
    public ReferralCodeResponse getReferralCode(HttpServletRequest request) {
        return referralService.getReferralCodeInfo(getCurrentUserId(request));
    }

    @GetMapping("/history")
    public Page<ReferralResponse> getReferralHistory(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return referralService.getReferralHistory(getCurrentUserId(request), pageable);
    }
}
