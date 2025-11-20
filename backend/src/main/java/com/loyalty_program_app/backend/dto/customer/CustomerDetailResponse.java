package com.loyalty_program_app.backend.dto.customer;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDetailResponse {

    private UUID id;
    private String name;
    private String email;
    private String phone;
    private boolean active;

    private Instant createdAt;
    private int totalBookings;
    private double totalSpent;

    private List<BookingResponse> bookings;
}
