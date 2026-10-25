package com.groomish_now.backend.repository;

import com.groomish_now.backend.model.BookingTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingTimelineRepository extends JpaRepository<BookingTimeline, UUID> {
    List<BookingTimeline> findByBookingIdOrderByCreatedAtAsc(UUID bookingId);

    List<BookingTimeline> findByBookingIdInOrderByCreatedAtAsc(java.util.Collection<UUID> bookingIds);
}
