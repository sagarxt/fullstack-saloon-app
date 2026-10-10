package com.loyalty_program_app.backend.repository;

import com.loyalty_program_app.backend.model.BookingProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingProductRepository extends JpaRepository<BookingProduct, UUID> {
    List<BookingProduct> findByBookingId(UUID bookingId);
}
