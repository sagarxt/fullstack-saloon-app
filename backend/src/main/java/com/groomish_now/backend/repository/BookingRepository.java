package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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
        WHERE b.status IN ('PENDING', 'CONFIRMED', 'MODIFIED', 'IN_PROGRESS', 'CHECKED_IN')
    """)
    List<Booking> findAllActiveBookings();
}
