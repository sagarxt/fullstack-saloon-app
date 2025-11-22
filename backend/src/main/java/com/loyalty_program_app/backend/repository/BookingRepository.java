package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface BookingRepository extends
        JpaRepository<Booking, UUID>,
        JpaSpecificationExecutor<Booking> {

    List<Booking> findByUserId(UUID userId);

    List<Booking> findByUserIdOrderByScheduledAtDesc(UUID userId);

    List<Booking> findByUserIdAndStatus(UUID userId, BookingStatus status);

    List<Booking> findByStatus(BookingStatus status);
}
