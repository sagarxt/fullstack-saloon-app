package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.customer.CustomerDetailResponse;
import com.loyalty_program_app.backend.dto.customer.CustomerResponse;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.BookingRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminCustomerServiceImpl {

    private final UserRepository userRepo;
    private final BookingRepository bookingRepo;

    /* ---------------------------------------
       GET ALL CUSTOMERS
    ---------------------------------------- */
    public List<CustomerResponse> getAllCustomers() {
        return userRepo.findByRole(Role.ROLE_CUSTOMER)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /* ---------------------------------------
       GET SINGLE CUSTOMER
    ---------------------------------------- */
    public CustomerResponse getCustomer(UUID id) {
        User u = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return toResponse(u);
    }

    /* ---------------------------------------
       DELETE CUSTOMER
    ---------------------------------------- */
    public void deleteCustomer(UUID id) {
        if (!userRepo.existsById(id)) {
            throw new RuntimeException("Customer not found");
        }
        userRepo.deleteById(id);
    }

    /* ---------------------------------------
       MAPPING: User → CustomerResponse
    ---------------------------------------- */
    private CustomerResponse toResponse(User u) {
        List<Booking> bookings = bookingRepo.findByUserId(u.getId());

        double totalSpent = bookings.stream()
                .mapToDouble(b -> b.getPricePaid() == null ? 0 : b.getPricePaid())
                .sum();

        return CustomerResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .active(u.isActive())
                .totalBookings(bookings.size())
                .totalSpent(totalSpent)
                .build();
    }

    /* ---------------------------------------
       CUSTOMER FULL DETAIL (PROFILE + HISTORY)
    ---------------------------------------- */
    public CustomerDetailResponse getCustomerDetail(UUID id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        List<Booking> bookings = bookingRepo.findByUserId(id);

        return CustomerDetailResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .totalBookings(bookings.size())
                .totalSpent(
                        bookings.stream()
                                .mapToDouble(b -> b.getPricePaid() == null ? 0 : b.getPricePaid())
                                .sum()
                )
                .bookings(
                        bookings.stream()
                                .map(b -> BookingResponse.builder()
                                        .id(b.getId())
                                        .serviceId(b.getServiceId())
                                        .scheduledAt(b.getScheduledAt())
                                        .pricePaid(b.getPricePaid())
                                        .status(b.getStatus())
                                        .note(b.getNote())
                                        .createdAt(b.getCreatedAt())
                                        .build()
                                ).toList()
                )
                .build();
    }

    /* ---------------------------------------
       SEARCH CUSTOMERS
    ---------------------------------------- */
    public List<CustomerResponse> searchCustomers(String keyword) {
        return userRepo
                .findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContainingIgnoreCase(
                        keyword, keyword, keyword
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }
}
