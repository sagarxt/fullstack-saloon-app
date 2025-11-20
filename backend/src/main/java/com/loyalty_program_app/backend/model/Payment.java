package com.loyalty_program_app.backend.model;

import com.loyalty_program_app.backend.enums.PaymentMethod;
import com.loyalty_program_app.backend.enums.PaymentStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

import java.util.UUID;

public class Payment {

    @Id
    @GeneratedValue
    private UUID id;

    private UUID userId;

    private UUID bookingId;

    @Enumerated(EnumType.STRING)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;
}
