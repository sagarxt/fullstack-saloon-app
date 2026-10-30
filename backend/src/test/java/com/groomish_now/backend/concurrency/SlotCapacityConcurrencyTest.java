package com.groomish_now.backend.concurrency;

import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.enums.Role;
import com.groomish_now.backend.model.Booking;
import com.groomish_now.backend.model.Store;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.BookingRepository;
import com.groomish_now.backend.repository.StoreRepository;
import com.groomish_now.backend.repository.UserRepository;
import com.groomish_now.backend.service.booking.SlotCapacityService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(SlotCapacityConcurrencyTest.TestBookingConfig.class)
public class SlotCapacityConcurrencyTest {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private BookingTransactionRunner bookingRunner;

    private User testUser;
    private Store testStore;
    private final List<UUID> createdBookingIds = new CopyOnWriteArrayList<>();

    @TestConfiguration
    public static class TestBookingConfig {
        @Bean
        public BookingTransactionRunner bookingTransactionRunner(
                SlotCapacityService slotCapacityService,
                BookingRepository bookingRepository
        ) {
            return new BookingTransactionRunner(slotCapacityService, bookingRepository);
        }
    }

    public static class BookingTransactionRunner {
        private final SlotCapacityService slotCapacityService;
        private final BookingRepository bookingRepository;

        public BookingTransactionRunner(SlotCapacityService slotCapacityService, BookingRepository bookingRepository) {
            this.slotCapacityService = slotCapacityService;
            this.bookingRepository = bookingRepository;
        }

        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public UUID bookSlotWithPessimisticLock(UUID storeId, LocalDateTime slotTime, int duration, User user, Store store) {
            // 1. Pessimistic Write Lock + Capacity Validation across all 5 stylist slots
            slotCapacityService.validateAndReserveSlotCapacity(storeId, slotTime, duration, null);

            // 2. Persist booking inside the lock transaction
            Booking booking = new Booking();
            booking.setUser(user);
            booking.setStore(store);
            booking.setBookingCode("CONC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            booking.setScheduledAt(slotTime);
            booking.setTotalDurationMinutes(duration);
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setTotalAmount(500.0);
            booking.setBookedBy("CONCURRENCY_TEST");

            Booking saved = bookingRepository.save(booking);
            return saved.getId();
        }
    }

    @BeforeEach
    void setup() {
        testStore = storeRepository.findAll().stream().findFirst().orElseGet(() -> {
            Store s = Store.builder()
                    .name("Concurrency Test Salon")
                    .code("CONC-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase())
                    .city("Bangalore")
                    .address("100 Feet Road")
                    .active(true)
                    .build();
            return storeRepository.save(s);
        });

        testUser = userRepository.findByEmail("concurrency_tester@groomish.now").orElseGet(() -> {
            User u = User.builder()
                    .name("Concurrency Tester")
                    .email("concurrency_tester@groomish.now")
                    .role(Role.ROLE_CUSTOMER)
                    .build();
            return userRepository.save(u);
        });
    }

    @AfterEach
    void tearDown() {
        for (UUID id : createdBookingIds) {
            try {
                bookingRepository.deleteById(id);
            } catch (Exception ignored) {}
        }
        createdBookingIds.clear();
    }

    @Test
    @DisplayName("Simultaneous checkouts on an empty slot: exactly 5 succeed, remainder rejected by pessimistic lock")
    void testSimultaneousTenCheckoutsOnEmptySlot_ExactlyFiveSucceed() throws Exception {
        LocalDateTime targetSlot = LocalDate.now().plusDays(40).atTime(11, 0);
        int totalConcurrentThreads = 10;

        ExecutorService executor = Executors.newFixedThreadPool(totalConcurrentThreads);
        CountDownLatch readyLatch = new CountDownLatch(totalConcurrentThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalConcurrentThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger capacityRejections = new AtomicInteger(0);
        List<String> unexpectedErrors = new CopyOnWriteArrayList<>();

        for (int i = 0; i < totalConcurrentThreads; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Release all threads at the exact same millisecond
                    UUID bookingId = bookingRunner.bookSlotWithPessimisticLock(
                            testStore.getId(),
                            targetSlot,
                            30,
                            testUser,
                            testStore
                    );
                    createdBookingIds.add(bookingId);
                    successCount.incrementAndGet();
                } catch (Exception ex) {
                    String msg = ex.getMessage();
                    Throwable cause = ex.getCause();
                    while (cause != null) {
                        if (cause.getMessage() != null) msg = cause.getMessage();
                        cause = cause.getCause();
                    }

                    if (msg != null && msg.contains("fully booked across all 5 salon stylists")) {
                        capacityRejections.incrementAndGet();
                    } else {
                        unexpectedErrors.add(msg != null ? msg : ex.getClass().getSimpleName());
                    }
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        assertTrue(readyLatch.await(10, TimeUnit.SECONDS), "All threads should be ready to fire");
        startLatch.countDown(); // FIRE!
        assertTrue(doneLatch.await(30, TimeUnit.SECONDS), "All concurrent threads should complete within timeout");
        executor.shutdown();

        System.out.println("=== Concurrency Test 1 Results ===");
        System.out.println("Successful Bookings: " + successCount.get());
        System.out.println("Capacity Rejections: " + capacityRejections.get());
        System.out.println("Unexpected Errors: " + unexpectedErrors);

        // Verification: Exactly 5 stylists occupied, exactly 5 threads rejected
        assertEquals(5, successCount.get(), "Exactly 5 bookings must succeed to fill 5 stylist chairs");
        assertEquals(5, capacityRejections.get(), "Remaining 5 checkouts must be rejected with capacity error");
        assertTrue(unexpectedErrors.isEmpty(), "No unexpected errors should occur: " + unexpectedErrors);

        // Database Verification: Total bookings for target slot must be strictly 5
        List<Booking> dayBookings = bookingRepository.findBookingsForDate(targetSlot.toLocalDate());
        long slotCount = dayBookings.stream()
                .filter(b -> targetSlot.equals(b.getScheduledAt()))
                .count();
        assertEquals(5, slotCount, "Database must strictly contain exactly 5 bookings for the slot");
    }

    @Test
    @DisplayName("Simultaneous checkouts when 4 slots are already occupied: exactly 1 succeeds, other 3 rejected")
    void testConcurrentCheckoutsWhenFourAlreadyBooked_OnlyOneSucceeds() throws Exception {
        LocalDateTime targetSlot = LocalDate.now().plusDays(41).atTime(15, 0);

        // Pre-fill 4 bookings for the target slot
        for (int i = 0; i < 4; i++) {
            UUID id = bookingRunner.bookSlotWithPessimisticLock(
                    testStore.getId(),
                    targetSlot,
                    30,
                    testUser,
                    testStore
            );
            createdBookingIds.add(id);
        }

        int simultaneousCheckouts = 4;
        ExecutorService executor = Executors.newFixedThreadPool(simultaneousCheckouts);
        CountDownLatch readyLatch = new CountDownLatch(simultaneousCheckouts);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(simultaneousCheckouts);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger capacityRejections = new AtomicInteger(0);
        List<String> unexpectedErrors = new CopyOnWriteArrayList<>();

        for (int i = 0; i < simultaneousCheckouts; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Simultaneous burst
                    UUID bookingId = bookingRunner.bookSlotWithPessimisticLock(
                            testStore.getId(),
                            targetSlot,
                            30,
                            testUser,
                            testStore
                    );
                    createdBookingIds.add(bookingId);
                    successCount.incrementAndGet();
                } catch (Exception ex) {
                    String msg = ex.getMessage();
                    Throwable cause = ex.getCause();
                    while (cause != null) {
                        if (cause.getMessage() != null) msg = cause.getMessage();
                        cause = cause.getCause();
                    }

                    if (msg != null && msg.contains("fully booked across all 5 salon stylists")) {
                        capacityRejections.incrementAndGet();
                    } else {
                        unexpectedErrors.add(msg != null ? msg : ex.getClass().getSimpleName());
                    }
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        assertTrue(readyLatch.await(10, TimeUnit.SECONDS), "All threads ready");
        startLatch.countDown();
        assertTrue(doneLatch.await(30, TimeUnit.SECONDS), "All threads completed");
        executor.shutdown();

        System.out.println("=== Concurrency Test 2 Results ===");
        System.out.println("Successful Bookings: " + successCount.get());
        System.out.println("Capacity Rejections: " + capacityRejections.get());
        System.out.println("Unexpected Errors: " + unexpectedErrors);

        // Exactly 1 additional booking could succeed (reaching capacity 5)
        assertEquals(1, successCount.get(), "Only 1 simultaneous checkout can claim the 5th stylist chair");
        assertEquals(3, capacityRejections.get(), "The other 3 simultaneous checkouts must be rejected");
        assertTrue(unexpectedErrors.isEmpty(), "No unexpected errors should occur: " + unexpectedErrors);

        // Database Verification: Total bookings for target slot must be strictly 5
        List<Booking> dayBookings = bookingRepository.findBookingsForDate(targetSlot.toLocalDate());
        long slotCount = dayBookings.stream()
                .filter(b -> targetSlot.equals(b.getScheduledAt()))
                .count();
        assertEquals(5, slotCount, "Database must strictly contain exactly 5 bookings for the slot");
    }
}
