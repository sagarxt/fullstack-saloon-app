package com.loyalty_program_app.backend.controller.staff;

import com.loyalty_program_app.backend.dto.points.PointsBalanceResponse;
import com.loyalty_program_app.backend.dto.points.PointsLedgerResponse;
import com.loyalty_program_app.backend.dto.referral.ReferralResponse;
import com.loyalty_program_app.backend.dto.payment.PaymentResponse;
import com.loyalty_program_app.backend.dto.staff.StaffCreateCustomerRequest;
import com.loyalty_program_app.backend.dto.user.UserResponse;
import com.loyalty_program_app.backend.dto.user.UserUpdateRequest;
import com.loyalty_program_app.backend.service.interfaces.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/customers")
@RequiredArgsConstructor
public class StaffCustomerController {

    private final StaffCustomerService staffCustomerService;
    private final CustomerPointsService customerPointsService;
    private final CustomerReferralService customerReferralService;
    private final CustomerPaymentService customerPaymentService;

    private UUID getCurrentStaffId(HttpServletRequest request) {
        return UUID.fromString((String) request.getAttribute("userId"));
    }

    // --- BASIC CUSTOMER MANAGEMENT ---

    @PostMapping
    public UserResponse createCustomer(
            HttpServletRequest request,
            @RequestBody StaffCreateCustomerRequest createRequest
    ) {
        return staffCustomerService.createCustomer(getCurrentStaffId(request), createRequest);
    }

    @PutMapping("/{id}")
    public UserResponse updateCustomer(
            HttpServletRequest request,
            @PathVariable UUID id,
            @RequestBody UserUpdateRequest updateRequest
    ) {
        return staffCustomerService.updateCustomer(getCurrentStaffId(request), id, updateRequest);
    }

    @DeleteMapping("/{id}")
    public void deactivateCustomer(
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        staffCustomerService.deactivateCustomer(getCurrentStaffId(request), id);
    }

    @GetMapping("/{id}")
    public UserResponse getCustomer(@PathVariable UUID id) {
        return staffCustomerService.getCustomer(id);
    }

    @GetMapping
    public Page<UserResponse> searchCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return staffCustomerService.searchCustomers(search, active, pageable);
    }

    // --- VIEW CUSTOMER POINTS / REFERRALS / PAYMENTS ---

    @GetMapping("/{id}/points")
    public PointsBalanceResponse getCustomerPoints(@PathVariable UUID id) {
        return customerPointsService.getBalance(id);
    }

    @GetMapping("/{id}/points/history")
    public Page<PointsLedgerResponse> getCustomerPointsHistory(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return customerPointsService.getHistory(id, pageable);
    }

    @GetMapping("/{id}/referrals")
    public Page<ReferralResponse> getCustomerReferrals(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return customerReferralService.getReferralHistory(id, pageable);
    }

    @GetMapping("/{id}/payments")
    public Page<PaymentResponse> getCustomerPayments(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return customerPaymentService.getMyPayments(id, pageable);
    }
}
