package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.BookingTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingTimelineRepository extends JpaRepository<BookingTimeline, UUID> {
    List<BookingTimeline> findByBookingIdOrderByCreatedAtAsc(UUID bookingId);
}
