package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByUserId(UUID userId);

    List<Booking> findByUserIdOrderByScheduledAtDesc(UUID userId);

    List<Booking> findByStatus(BookingStatus status);

    @Query("""
    SELECT b FROM Booking b
    WHERE 
        LOWER(b.note) LIKE :keyword OR
        CAST(b.userId AS string) LIKE :keyword OR
        CAST(b.serviceId AS string) LIKE :keyword OR
        LOWER(b.status) LIKE :keyword
    """)
    List<Booking> search(String keyword);

}
