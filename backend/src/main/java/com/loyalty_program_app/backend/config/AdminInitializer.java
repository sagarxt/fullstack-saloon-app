package com.loyalty_program_app.backend.config;

import com.loyalty_program_app.backend.enums.Gender;
import com.loyalty_program_app.backend.enums.PointReason;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.enums.Tier;
import com.loyalty_program_app.backend.model.PointsLedger;
import com.loyalty_program_app.backend.model.Product;
import com.loyalty_program_app.backend.model.Referral;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.ProductRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.util.BookingCodeGenerator;
import com.loyalty_program_app.backend.util.ReferralCodeGenerator;
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
    private final com.loyalty_program_app.backend.repository.ReferralRepository referralRepository;
    private final com.loyalty_program_app.backend.repository.PointsLedgerRepository pointsLedgerRepository;
    private final com.loyalty_program_app.backend.repository.CouponRepository couponRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    private final com.loyalty_program_app.backend.repository.StoreServiceAvailabilityRepository storeServiceAvailabilityRepository;
    private final com.loyalty_program_app.backend.repository.StoreProductInventoryRepository storeProductInventoryRepository;
    private final com.loyalty_program_app.backend.repository.CartRepository cartRepository;
    private final com.loyalty_program_app.backend.repository.PaymentRepository paymentRepository;
    private final com.loyalty_program_app.backend.repository.NotificationRepository notificationRepository;
    private final com.loyalty_program_app.backend.repository.PolicyFaqRepository policyFaqRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {

        // Ensure database check constraint on payments table supports ONLINE payment method
        try {
            jdbcTemplate.execute("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check");
            jdbcTemplate.execute("ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'ONLINE'))");
            System.out.println("✔ Successfully updated payments_payment_method_check constraint to include ONLINE.");
        } catch (Exception e) {
            System.err.println("Notice on payments_payment_method_check: " + e.getMessage());
        }

        // Seed initial coupons if none exist
        if (couponRepository.count() == 0) {
            com.loyalty_program_app.backend.model.Coupon c1 = com.loyalty_program_app.backend.model.Coupon.builder()
                    .code("GROOM100")
                    .description("Flat ₹100 off on signature salon care & styling services")
                    .discount(100.0)
                    .maxDiscount(100.0)
                    .minAmount(499.0)
                    .expiryDate(LocalDateTime.now().plusMonths(3))
                    .active(true)
                    .build();
            com.loyalty_program_app.backend.model.Coupon c2 = com.loyalty_program_app.backend.model.Coupon.builder()
                    .code("GLOW50")
                    .description("Flat ₹50 instant discount on hair serums & facial cleansers")
                    .discount(50.0)
                    .maxDiscount(50.0)
                    .minAmount(299.0)
                    .expiryDate(LocalDateTime.now().plusMonths(3))
                    .active(true)
                    .build();
            com.loyalty_program_app.backend.model.Coupon c3 = com.loyalty_program_app.backend.model.Coupon.builder()
                    .code("ROYAL250")
                    .description("Luxury makeover offer: ₹250 off on total cart value above ₹1299")
                    .discount(250.0)
                    .maxDiscount(250.0)
                    .minAmount(1299.0)
                    .expiryDate(LocalDateTime.now().plusMonths(3))
                    .active(true)
                    .build();
            couponRepository.saveAll(List.of(c1, c2, c3));
            System.out.println("✔ Seeded 3 active promo coupons (GROOM100, GLOW50, ROYAL250).");
        }

        // Purge any default legacy branches (IND-01, KOR-02, HSR-03, WTF-04) and their related bookings & staff
        List<String> defaultStoreCodes = List.of("IND-01", "KOR-02", "HSR-03", "WTF-04");
        List<String> defaultStoreNames = List.of(
                "Groomish Indiranagar Flagship",
                "Groomish Koramangala Lounge",
                "Groomish HSR Layout Studio",
                "Groomish Whitefield Prestige"
        );

        List<com.loyalty_program_app.backend.model.Store> defaultStores = storeRepository.findAll().stream()
                .filter(s -> (s.getCode() != null && defaultStoreCodes.contains(s.getCode()))
                        || (s.getName() != null && defaultStoreNames.contains(s.getName())))
                .toList();

        if (!defaultStores.isEmpty()) {
            java.util.Set<java.util.UUID> defaultStoreIds = defaultStores.stream()
                    .map(com.loyalty_program_app.backend.model.Store::getId)
                    .collect(java.util.stream.Collectors.toSet());

            // 1. Purge all bookings related to default branches
            List<com.loyalty_program_app.backend.model.Booking> defaultBookings = bookingRepository.findAll().stream()
                    .filter(b -> (b.getStore() != null && defaultStoreIds.contains(b.getStore().getId()))
                            || (b.getStoreNameSnapshot() != null && defaultStoreNames.contains(b.getStoreNameSnapshot())))
                    .toList();

            if (!defaultBookings.isEmpty()) {
                List<com.loyalty_program_app.backend.model.Payment> paymentsToDelete = defaultBookings.stream()
                        .map(com.loyalty_program_app.backend.model.Booking::getPayment)
                        .filter(java.util.Objects::nonNull)
                        .toList();

                bookingRepository.deleteAll(defaultBookings);
                if (!paymentsToDelete.isEmpty()) {
                    try {
                        paymentRepository.deleteAll(paymentsToDelete);
                    } catch (Exception ignored) {}
                }
                System.out.println("✔ Purged " + defaultBookings.size() + " bookings associated with default branches.");
            }

            // 2. Purge all staff members assigned to default branches
            List<User> staffToDelete = userRepository.findByRole(Role.ROLE_STAFF).stream()
                    .filter(u -> u.getStore() != null && defaultStoreIds.contains(u.getStore().getId()))
                    .toList();

            if (!staffToDelete.isEmpty()) {
                for (User staff : staffToDelete) {
                    notificationRepository.deleteAllByUserId(staff.getId());
                    cartRepository.findAll().stream()
                            .filter(c -> c.getUser() != null && c.getUser().getId().equals(staff.getId()))
                            .forEach(cartRepository::delete);
                }
                userRepository.deleteAll(staffToDelete);
                System.out.println("✔ Purged " + staffToDelete.size() + " staff members assigned to default branches.");
            }

            // 3. Clear store reference in any carts assigned to default branches
            List<com.loyalty_program_app.backend.model.Cart> cartsWithDefaultStore = cartRepository.findAll().stream()
                    .filter(c -> c.getStore() != null && defaultStoreIds.contains(c.getStore().getId()))
                    .toList();
            for (var c : cartsWithDefaultStore) {
                c.setStore(null);
                cartRepository.save(c);
            }

            // 4. Delete branch catalog inventory & service availability
            for (java.util.UUID sId : defaultStoreIds) {
                var availabilities = storeServiceAvailabilityRepository.findByStoreId(sId);
                if (!availabilities.isEmpty()) {
                    storeServiceAvailabilityRepository.deleteAll(availabilities);
                }
                var inventories = storeProductInventoryRepository.findByStoreId(sId);
                if (!inventories.isEmpty()) {
                    storeProductInventoryRepository.deleteAll(inventories);
                }
            }

            // 5. Delete default stores
            storeRepository.deleteAll(defaultStores);
            System.out.println("✔ Purged " + defaultStores.size() + " default salon branches from database.");
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
                b.setBookingCode(BookingCodeGenerator.generateUniqueCode(bookingRepository));
                bookingRepository.save(b);
            }
            System.out.println("✔ Backfilled unique 10-char Booking IDs for " + bookingsWithoutCode.size() + " existing bookings.");
        }

        // Backfill unique 6-char referral codes for any existing customers missing one
        List<User> customersWithoutReferral = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROLE_CUSTOMER && (u.getReferralCode() == null || u.getReferralCode().isBlank()))
                .toList();

        if (!customersWithoutReferral.isEmpty()) {
            for (User u : customersWithoutReferral) {
                u.setReferralCode(ReferralCodeGenerator.generateUniqueReferralCode(u.getName(), userRepository));
                userRepository.save(u);
            }
            System.out.println("✔ Backfilled unique referral codes for " + customersWithoutReferral.size() + " customers.");
        }

        // Backfill 10 referral points and PointsLedger for any existing unrewarded referrals
        List<Referral> unrewardedReferrals = referralRepository.findAll().stream()
                .filter(r -> !r.isRewardGiven() && r.getReferrer() != null)
                .toList();

        if (!unrewardedReferrals.isEmpty()) {
            for (Referral r : unrewardedReferrals) {
                User referrer = r.getReferrer();
                User referred = r.getReferred();
                int referralBonus = 10;
                referrer.setPoints((referrer.getPoints() != null ? referrer.getPoints() : 0) + referralBonus);
                referrer.setLifetimePoints((referrer.getLifetimePoints() != null ? referrer.getLifetimePoints() : (referrer.getPoints() != null ? referrer.getPoints() : 0)) + referralBonus);
                userRepository.save(referrer);

                PointsLedger ledger = new PointsLedger();
                ledger.setUser(referrer);
                ledger.setChangeAmount(referralBonus);
                ledger.setReason(PointReason.REFERRAL_BONUS);
                ledger.setRelatedId(referred != null ? referred.getId() : null);
                ledger.setNote("Referred to " + (referred != null ? referred.getName() : "Friend"));
                ledger.setCreatedAt(LocalDateTime.now());
                pointsLedgerRepository.save(ledger);

                r.setRewardGiven(true);
                r.setPointsLedger(ledger);
                referralRepository.save(r);
            }
            System.out.println("✔ Backfilled 10 referral points for " + unrewardedReferrals.size() + " existing referrals.");
        }

        // Seed initial Policy and Q&A items if none exist
        if (policyFaqRepository.count() == 0) {
            // Policies (Order, Payment, Cancellation, Refund)
            policyFaqRepository.save(com.loyalty_program_app.backend.model.PolicyFaqItem.builder()
                    .type(com.loyalty_program_app.backend.enums.PolicyFaqType.POLICY)
                    .category("ORDER")
                    .heading("Order & Appointment Booking Policy")
                    .description("All salon appointments and grooming product orders can be booked online via Groomish Now. We recommend booking slots at least 2 hours in advance to guarantee your preferred stylist and branch. Walk-in guests are always welcomed subject to chair and stylist availability. Once your booking is confirmed, an instant confirmation SMS, email, and notification with your booking reference will be provided.")
                    .displayOrder(1)
                    .active(true)
                    .build());

            policyFaqRepository.save(com.loyalty_program_app.backend.model.PolicyFaqItem.builder()
                    .type(com.loyalty_program_app.backend.enums.PolicyFaqType.POLICY)
                    .category("PAYMENT")
                    .heading("Payment Methods & Billing Policy")
                    .description("We support a wide variety of safe and instant payment options: UPI (Google Pay, PhonePe, Paytm), Visa/Mastercard/RuPay Credit and Debit Cards, Net Banking, and Groomish Wallet GroomCoins. Customers may choose to pay online during checkout or pay in person after service completion at the salon counter. All salon tariffs and product prices are transparent and inclusive of applicable GST.")
                    .displayOrder(2)
                    .active(true)
                    .build());

            policyFaqRepository.save(com.loyalty_program_app.backend.model.PolicyFaqItem.builder()
                    .type(com.loyalty_program_app.backend.enums.PolicyFaqType.POLICY)
                    .category("CANCELLATION")
                    .heading("Cancellation & Rescheduling Policy")
                    .description("We understand that plans can change. You may reschedule or cancel your appointment free of charge up to 2 hours before the scheduled time directly from your 'My Bookings' page. Rescheduling is subject to available branch slots. Cancellations requested less than 2 hours before the appointment or unattended bookings (no-shows) may forfeit reserved promotional coupons or incur a slot holding deduction.")
                    .displayOrder(3)
                    .active(true)
                    .build());

            policyFaqRepository.save(com.loyalty_program_app.backend.model.PolicyFaqItem.builder()
                    .type(com.loyalty_program_app.backend.enums.PolicyFaqType.POLICY)
                    .category("REFUND")
                    .heading("Refund & GroomCoin Reversal Policy")
                    .description("For prepaid bookings cancelled in accordance with our cancellation policy, refunds are initiated immediately. Card and Net Banking refunds typically reflect in your account within 3–5 business days depending on your bank. Alternatively, customers can opt for instant GroomCoin credit to their Groomish Wallet. Any GroomCoins redeemed towards the cancelled booking are automatically reversed to your balance.")
                    .displayOrder(4)
                    .active(true)
                    .build());

            // Q&A
            policyFaqRepository.save(com.loyalty_program_app.backend.model.PolicyFaqItem.builder()
                    .type(com.loyalty_program_app.backend.enums.PolicyFaqType.QA)
                    .category("BOOKINGS")
                    .heading("How do I book an appointment on Groomish Now?")
                    .description("Simply select your nearest salon branch, choose your desired grooming services or packages, pick an available date and time slot, and proceed to checkout. You can pay online or choose Pay at Salon.")
                    .displayOrder(1)
                    .active(true)
                    .build());

            policyFaqRepository.save(com.loyalty_program_app.backend.model.PolicyFaqItem.builder()
                    .type(com.loyalty_program_app.backend.enums.PolicyFaqType.QA)
                    .category("LOYALTY")
                    .heading("What are GroomCoins and how do I earn and redeem them?")
                    .description("GroomCoins are VIP reward coins earned on every service booking and retail product purchase. As your Tier progresses from Bronze to Silver, Gold, and Platinum, you unlock higher reward coin multipliers. You can redeem GroomCoins during checkout for instant bill discounts or exchange them for exclusive salon vouchers.")
                    .displayOrder(2)
                    .active(true)
                    .build());

            policyFaqRepository.save(com.loyalty_program_app.backend.model.PolicyFaqItem.builder()
                    .type(com.loyalty_program_app.backend.enums.PolicyFaqType.QA)
                    .category("SERVICES")
                    .heading("Can I add extra services or customize my treatment at the salon?")
                    .description("Yes! During your consultation, your master stylist can recommend additions or customize your treatment. Our staff can add the extra services directly to your active booking.")
                    .displayOrder(3)
                    .active(true)
                    .build());

            policyFaqRepository.save(com.loyalty_program_app.backend.model.PolicyFaqItem.builder()
                    .type(com.loyalty_program_app.backend.enums.PolicyFaqType.QA)
                    .category("PAYMENT")
                    .heading("Is online payment mandatory when booking?")
                    .description("No, online payment is optional. You can choose to pay securely online via UPI, Cards, or Net Banking, or select 'Pay at Salon' to settle the bill upon service completion.")
                    .displayOrder(4)
                    .active(true)
                    .build());

            policyFaqRepository.save(com.loyalty_program_app.backend.model.PolicyFaqItem.builder()
                    .type(com.loyalty_program_app.backend.enums.PolicyFaqType.QA)
                    .category("CANCELLATION")
                    .heading("How do I cancel or reschedule my appointment?")
                    .description("Go to 'My Bookings' from the customer navigation menu, select the booking you wish to modify, and click 'Reschedule Appointment' or 'Cancel Booking'. Changes are free up to 2 hours before the scheduled time.")
                    .displayOrder(5)
                    .active(true)
                    .build());

            System.out.println("✔ Seeded initial Policy and Q&A entries.");
        }
    }
}
