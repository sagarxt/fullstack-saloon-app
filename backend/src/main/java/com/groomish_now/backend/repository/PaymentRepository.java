package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Page<Payment> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    java.util.Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    java.util.Optional<Payment> findByPaymentGatewayId(String paymentGatewayId);
}
