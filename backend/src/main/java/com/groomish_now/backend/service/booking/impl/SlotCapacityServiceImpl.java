package com.groomish_now.backend.service.booking.impl;

import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.model.Booking;
import com.groomish_now.backend.model.StoreSlotLock;
import com.groomish_now.backend.repository.BookingRepository;
import com.groomish_now.backend.repository.StoreSlotLockRepository;
import com.groomish_now.backend.service.booking.SlotCapacityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlotCapacityServiceImpl implements SlotCapacityService {

    public static final int MAX_CONCURRENT_STYLISTS = 5;
    public static final UUID DEFAULT_STORE_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private final StoreSlotLockRepository storeSlotLockRepository;
    private final BookingRepository bookingRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ensureLockRowExists(UUID storeId, LocalDate slotDate) {
        try {
            storeSlotLockRepository.upsertLockRowNative(storeId, slotDate);
        } catch (Exception ex) {
            try {
                Optional<StoreSlotLock> existing = storeSlotLockRepository.findByStoreIdAndSlotDate(storeId, slotDate);
                if (existing.isEmpty()) {
                    StoreSlotLock lock = StoreSlotLock.builder()
                            .storeId(storeId)
                            .slotDate(slotDate)
                            .totalBookingsToday(0)
                            .updatedAt(LocalDateTime.now())
                            .build();
                    storeSlotLockRepository.saveAndFlush(lock);
                }
            } catch (Exception ignored) {
                // Concurrent insert succeeded in another thread
            }
        }
    }

    @Override
    @Transactional
    public void validateAndReserveSlotCapacity(
            UUID storeId,
            LocalDateTime reqStart,
            int durationMinutes,
            UUID excludeBookingId
    ) {
        if (reqStart == null) {
            throw new RuntimeException("Appointment slot time is required");
        }

        UUID safeStoreId = storeId != null ? storeId : DEFAULT_STORE_ID;
        LocalDate slotDate = reqStart.toLocalDate();
        int safeDuration = durationMinutes > 0 ? durationMinutes : 30;
        LocalDateTime reqEnd = reqStart.plusMinutes(safeDuration);

        // 1. Ensure lock row exists (isolated transaction to prevent rollback taint)
        ensureLockRowExists(safeStoreId, slotDate);

        // 2. Acquire Pessimistic Write Lock (SELECT ... FOR UPDATE) on the store+date row
        StoreSlotLock lock = storeSlotLockRepository.findByStoreIdAndSlotDateForUpdate(safeStoreId, slotDate)
                .orElseThrow(() -> new RuntimeException("Failed to acquire pessimistic slot lock for " + slotDate));

        log.debug("Acquired pessimistic lock on StoreSlotLock id={} for store={} on date={}",
                lock.getId(), safeStoreId, slotDate);

        // 3. Query all non-cancelled bookings for that date
        List<Booking> dayBookings = bookingRepository.findBookingsForDate(slotDate);

        // 4. Calculate overlapping appointments across the 5 stylist chairs
        int overlapCount = 0;
        for (Booking b : dayBookings) {
            if (excludeBookingId != null && b.getId() != null && b.getId().equals(excludeBookingId)) {
                continue;
            }
            if (b.getStatus() == BookingStatus.CANCELLED) {
                continue;
            }
            LocalDateTime bStart = b.getScheduledAt();
            if (bStart == null) continue;

            int bDur = b.getTotalDurationMinutes() != null && b.getTotalDurationMinutes() > 0
                    ? b.getTotalDurationMinutes() : 30;
            LocalDateTime bEnd = bStart.plusMinutes(bDur);

            // Overlap condition: bStart < reqEnd && bEnd > reqStart
            if (bStart.isBefore(reqEnd) && bEnd.isAfter(reqStart)) {
                overlapCount++;
            }
        }

        log.info("Slot capacity evaluation: reqStart={}, reqEnd={}, overlaps={}, maxAllowed={}",
                reqStart, reqEnd, overlapCount, MAX_CONCURRENT_STYLISTS);

        if (overlapCount >= MAX_CONCURRENT_STYLISTS) {
            throw new RuntimeException("Selected time slot is fully booked across all 5 salon stylists. Please select another slot.");
        }

        // 5. Update lock metadata counter
        lock.setTotalBookingsToday(lock.getTotalBookingsToday() != null ? lock.getTotalBookingsToday() + 1 : 1);
        lock.setUpdatedAt(LocalDateTime.now());
        storeSlotLockRepository.save(lock);
    }
}
