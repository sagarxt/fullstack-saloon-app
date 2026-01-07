package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.BookingItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BookingItemRepository extends JpaRepository<BookingItem, UUID> {

}
