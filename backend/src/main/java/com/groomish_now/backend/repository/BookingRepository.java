package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    java.util.Optional<Booking> findByBookingCodeIgnoreCase(String bookingCode);

    java.util.Optional<Booking> findFirstByBookingCodeStartingWithIgnoreCase(String prefix);

    java.util.Optional<Booking> findByRazorpayOrderId(String razorpayOrderId);

    List<Booking> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Page<Booking> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

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
        WHERE b.status IN ('PENDING', 'CONFIRMED', 'MODIFIED', 'NO_SHOW', 'IN_PROGRESS', 'CHECKED_IN')
    """)
    List<Booking> findAllActiveBookings();

    @Query("""
        SELECT b FROM Booking b
        WHERE b.scheduledAt IS NOT NULL
          AND b.scheduledAt < :cutoff
          AND b.status IN (
              com.groomish_now.backend.enums.BookingStatus.MODIFIED,
              com.groomish_now.backend.enums.BookingStatus.CONFIRMED,
              com.groomish_now.backend.enums.BookingStatus.PENDING,
              com.groomish_now.backend.enums.BookingStatus.NO_SHOW
          )
    """)
    List<Booking> findOverdueBookingsForCancellation(@Param("cutoff") LocalDateTime cutoff);
}
