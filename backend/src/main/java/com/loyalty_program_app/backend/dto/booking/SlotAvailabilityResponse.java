package com.loyalty_program_app.backend.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class SlotAvailabilityResponse {

    private List<String> unavailableSlots; // HH:mm format
}
