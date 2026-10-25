package com.groomish_now.backend.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingTimelineResponse {
    private UUID id;
    private String action;
    private String title;
    private String description;
    private String performedBy;
    private String performedByRole;
    private String performedByEmail;
    private LocalDateTime createdAt;
}
