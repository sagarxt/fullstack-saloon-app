package com.groomish_now.backend.service.staff;

import com.groomish_now.backend.dto.booking.BookingResponse;
import com.groomish_now.backend.dto.booking.CustomerUpdateBookingRequest;
import com.groomish_now.backend.dto.staff.StaffCreateBookingRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StaffBookingService {

    BookingResponse createBookingForCustomer(UUID staffId, StaffCreateBookingRequest request);

    BookingResponse updateBookingForCustomer(UUID staffId, UUID bookingId, CustomerUpdateBookingRequest request);

    BookingResponse cancelBookingForCustomer(UUID staffId, UUID bookingId, String note);

    Page<BookingResponse> getCustomerBookings(UUID customerId, Pageable pageable);

    BookingResponse getBooking(UUID bookingId);

    BookingResponse addServiceToBooking(UUID staffId, UUID bookingId, UUID serviceId, String subServiceName);

    BookingResponse removeServiceFromBooking(UUID staffId, UUID bookingId, UUID itemId);

    BookingResponse confirmBookingForCustomer(UUID staffId, UUID bookingId);

    BookingResponse startBookingForCustomer(UUID staffId, UUID bookingId);

    BookingResponse checkInBookingForCustomer(UUID staffId, UUID bookingId);
}
