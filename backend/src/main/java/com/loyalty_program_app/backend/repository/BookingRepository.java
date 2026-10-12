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

    boolean existsByBookingCode(String bookingCode);

    java.util.Optional<Booking> findByBookingCode(String bookingCode);

    @Query("""
        SELECT b FROM Booking b
        WHERE DATE(b.scheduledAt) = :date
          AND b.status <> 'CANCELLED'
    """)
    List<Booking> findBookingsForDate(@Param("date") LocalDate date);

    /* ===============================
       SCHEDULER / ACTIVE BOOKINGS
       =============================== */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.status IN ('PENDING', 'CONFIRMED', 'MODIFIED')
    """)
    List<Booking> findAllActiveBookings();
}
