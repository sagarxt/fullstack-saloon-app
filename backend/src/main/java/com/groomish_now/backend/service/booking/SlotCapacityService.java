package com.groomish_now.backend.service.booking;

import java.time.LocalDateTime;
import java.util.UUID;

public interface SlotCapacityService {

    /**
     * Acquires a pessimistic write lock for the store and date,
     * calculates active overlapping bookings across all 5 stylist slots,
     * and validates that the requested slot does not exceed max capacity (5 concurrent stylists).
     *
     * @param storeId Store / Branch UUID (if null, fallback default is used)
     * @param reqStart Start time of requested appointment
     * @param durationMinutes Total duration in minutes (minimum 30)
     * @param excludeBookingId Optional booking ID to exclude from overlap calculation (e.g., when rescheduling)
     * @throws RuntimeException if overlapping bookings >= 5
     */
    void validateAndReserveSlotCapacity(
            UUID storeId,
            LocalDateTime reqStart,
            int durationMinutes,
            UUID excludeBookingId
    );
}
