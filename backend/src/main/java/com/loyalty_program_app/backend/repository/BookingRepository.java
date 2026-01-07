package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID>, JpaSpecificationExecutor<Booking> {

    /* ===============================
       CUSTOMER
       =============================== */

    List<Booking> findByUserId(UUID userId);

    @Query("""
        SELECT b FROM Booking b
        WHERE DATE(b.scheduledAt) = :date
          AND b.status <> 'CANCELLED'
    """)
    List<Booking> findBookingsForDate(@Param("date") LocalDate date);

    /* ===============================
       SLOT OVERLAP CHECK
       =============================== */

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.status <> 'CANCELLED'
          AND b.scheduledAt < :endTime
          AND FUNCTION('DATE_ADD', b.scheduledAt,
              FUNCTION('INTERVAL', b.totalDurationMinutes, 'MINUTE')
          ) > :startTime
    """)
    boolean existsOverlappingBooking(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.id <> :bookingId
          AND b.status <> 'CANCELLED'
          AND b.scheduledAt < :endTime
          AND FUNCTION('DATE_ADD', b.scheduledAt,
              FUNCTION('INTERVAL', b.totalDurationMinutes, 'MINUTE')
          ) > :startTime
    """)
    boolean existsOverlappingBookingExcludingSelf(
            @Param("bookingId") UUID bookingId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}
