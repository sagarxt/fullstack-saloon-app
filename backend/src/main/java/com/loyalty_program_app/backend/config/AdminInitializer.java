package com.loyalty_program_app.backend.config;

import com.loyalty_program_app.backend.enums.Gender;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.enums.Tier;
import com.loyalty_program_app.backend.model.Product;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.ProductRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final com.loyalty_program_app.backend.repository.BookingRepository bookingRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // Check if ANY admin exists
        if (userRepository.findByRole(Role.ROLE_ADMIN).isEmpty()) {

            User admin = User.builder()
                    .name("Super Admin")
                    .email("admin@loyaltyapp.com")
                    .phone("9999999999")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ROLE_ADMIN)
                    .gender(Gender.NOT_SPECIFIED)
                    .tier(Tier.SILVER)
                    .points(0)
                    .referralCode("ADMIN")
                    .active(true)
                    .createdBy(null)
                    .updatedBy(null)
                    .createdAt(LocalDateTime.now())
                    .lastLoginAt(null)
                    .dob(null)
                    .build();

            userRepository.save(admin);

            System.out.println("✔ Default ADMIN created → email: admin@loyaltyapp.com  password: admin123");

        } else {
            System.out.println("✔ Admin already exists. Skipping creation.");
        }

        // Remove any dummy seeded products so only admin-uploaded products exist
        List<String> dummyNames = List.of(
                "Moroccan Argan Hair Elixir",
                "Hydra-Boost Hyaluronic Facial Cleanser",
                "Keratin Intense Repair Hair Mask",
                "Organic Cedarwood Beard Conditioning Oil",
                "Matte Finish Clay Wax",
                "Volumizing Sea Salt Texture Spray",
                "Activated Bamboo Charcoal Detox Scrub",
                "Sandalwood & Aloe Aftershave Balm"
        );
        List<Product> dummyProducts = productRepository.findAll().stream()
                .filter(p -> dummyNames.contains(p.getName()))
                .toList();
        if (!dummyProducts.isEmpty()) {
            productRepository.deleteAll(dummyProducts);
            System.out.println("✔ Purged " + dummyProducts.size() + " dummy products. Catalog now only reflects genuine admin uploads.");
        }

        // Backfill unique booking codes for any existing bookings
        List<com.loyalty_program_app.backend.model.Booking> bookingsWithoutCode = bookingRepository.findAll().stream()
                .filter(b -> b.getBookingCode() == null || b.getBookingCode().isBlank())
                .toList();

        if (!bookingsWithoutCode.isEmpty()) {
            for (com.loyalty_program_app.backend.model.Booking b : bookingsWithoutCode) {
                b.setBookingCode(com.loyalty_program_app.backend.util.BookingCodeGenerator.generateUniqueCode(bookingRepository));
                bookingRepository.save(b);
            }
            System.out.println("✔ Backfilled unique 10-char Booking IDs for " + bookingsWithoutCode.size() + " existing bookings.");
        }
    }
}
