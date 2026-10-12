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
    private final com.loyalty_program_app.backend.repository.StoreRepository storeRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // Seed 4 Flagship Bangalore Salons if none exist
        if (storeRepository.count() == 0) {
            com.loyalty_program_app.backend.model.Store indiranagar = com.loyalty_program_app.backend.model.Store.builder()
                    .name("Groomish Indiranagar Flagship")
                    .code("IND-01")
                    .address("100 Feet Rd, 12th Main, HAL 2nd Stage, Indiranagar")
                    .city("Bengaluru")
                    .state("Karnataka")
                    .pincode("560038")
                    .phone("+91 80 4123 4567")
                    .email("indiranagar@groomish.com")
                    .latitude(12.971891)
                    .longitude(77.641151)
                    .openingTime("09:00")
                    .closingTime("21:30")
                    .image("https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80")
                    .active(true)
                    .build();

            com.loyalty_program_app.backend.model.Store koramangala = com.loyalty_program_app.backend.model.Store.builder()
                    .name("Groomish Koramangala Lounge")
                    .code("KOR-02")
                    .address("80 Feet Rd, 4th Block, Koramangala")
                    .city("Bengaluru")
                    .state("Karnataka")
                    .pincode("560034")
                    .phone("+91 80 4234 5678")
                    .email("koramangala@groomish.com")
                    .latitude(12.935192)
                    .longitude(77.624480)
                    .openingTime("09:00")
                    .closingTime("21:30")
                    .image("https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80")
                    .active(true)
                    .build();

            com.loyalty_program_app.backend.model.Store hsr = com.loyalty_program_app.backend.model.Store.builder()
                    .name("Groomish HSR Layout Studio")
                    .code("HSR-03")
                    .address("Sector 3, 27th Main Road, HSR Layout")
                    .city("Bengaluru")
                    .state("Karnataka")
                    .pincode("560102")
                    .phone("+91 80 4345 6789")
                    .email("hsr@groomish.com")
                    .latitude(12.911622)
                    .longitude(77.638863)
                    .openingTime("09:30")
                    .closingTime("21:00")
                    .image("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80")
                    .active(true)
                    .build();

            com.loyalty_program_app.backend.model.Store whitefield = com.loyalty_program_app.backend.model.Store.builder()
                    .name("Groomish Whitefield Prestige")
                    .code("WTF-04")
                    .address("ITPL Main Road, Prestige Shantiniketan, Whitefield")
                    .city("Bengaluru")
                    .state("Karnataka")
                    .pincode("560066")
                    .phone("+91 80 4456 7890")
                    .email("whitefield@groomish.com")
                    .latitude(12.983027)
                    .longitude(77.752319)
                    .openingTime("10:00")
                    .closingTime("22:00")
                    .image("https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1200&q=80")
                    .active(true)
                    .build();

            storeRepository.saveAll(List.of(indiranagar, koramangala, hsr, whitefield));
            System.out.println("✔ Seeded 4 Groomish flagship stores in Bengaluru.");
        }

        // Link existing staff members without store to Indiranagar flagship
        var primaryStore = storeRepository.findAllByActiveTrueOrderByCreatedAtAsc().stream().findFirst().orElse(null);
        if (primaryStore != null) {
            List<User> staffWithoutStore = userRepository.findByRole(Role.ROLE_STAFF).stream()
                    .filter(u -> u.getStore() == null)
                    .toList();
            if (!staffWithoutStore.isEmpty()) {
                for (User s : staffWithoutStore) {
                    s.setStore(primaryStore);
                    userRepository.save(s);
                }
                System.out.println("✔ Assigned primary store (" + primaryStore.getName() + ") to " + staffWithoutStore.size() + " existing staff members.");
            }

            // Also backfill any legacy bookings without store
            List<com.loyalty_program_app.backend.model.Booking> legacyBookings = bookingRepository.findAll().stream()
                    .filter(b -> b.getStore() == null && b.getStoreNameSnapshot() == null)
                    .toList();
            if (!legacyBookings.isEmpty()) {
                for (var b : legacyBookings) {
                    b.setStore(primaryStore);
                    b.setStoreNameSnapshot(primaryStore.getName());
                    b.setStoreAddressSnapshot(primaryStore.getAddress() + ", " + primaryStore.getCity());
                    bookingRepository.save(b);
                }
                System.out.println("✔ Backfilled store branch for " + legacyBookings.size() + " legacy bookings.");
            }
        }

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
