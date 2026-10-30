package com.groomish_now.backend.scheduler;

import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.enums.PaymentMethod;
import com.groomish_now.backend.enums.PaymentStatus;
import com.groomish_now.backend.model.Booking;
import com.groomish_now.backend.model.Payment;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.BookingItemRepository;
import com.groomish_now.backend.repository.BookingRepository;
import com.groomish_now.backend.repository.NotificationRepository;
import com.groomish_now.backend.repository.PaymentRepository;
import com.groomish_now.backend.service.booking.BookingTimelineService;
import com.groomish_now.backend.service.booking.impl.BookingSchedulerServiceImpl;
import com.groomish_now.backend.service.notification.ExpoPushNotificationService;
import com.groomish_now.backend.service.payment.RazorpayRefundService;
import com.groomish_now.backend.service.utils.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OverdueBookingAutoCancellationTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingTimelineService bookingTimelineService;

    @Mock
    private ExpoPushNotificationService expoPushNotificationService;

    @Mock
    private BookingItemRepository bookingItemRepository;

    @Mock
    private RazorpayRefundService razorpayRefundService;

    @InjectMocks
    private BookingSchedulerServiceImpl schedulerService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .name("Test Customer")
                .email("customer@test.com")
                .build();
    }

    @Test
    void testCancelOverdueConfirmedBookingWithPaidAmountProcessesRefund() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = Booking.builder()
                .user(testUser)
                .bookingCode("GN-TEST01")
                .scheduledAt(LocalDateTime.now().minusHours(3))
                .status(BookingStatus.CONFIRMED)
                .pricePaid(799.0)
                .build();
        booking.setId(bookingId);

        when(bookingRepository.findOverdueBookingsForCancellation(any(LocalDateTime.class)))
                .thenReturn(List.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        schedulerService.cancelOverdueBookings();

        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        assertTrue(booking.getAutoCancelled());
        assertNotNull(booking.getCancelledAt());
        assertEquals("PROCESSED", booking.getRefundStatus());
        assertEquals(799.0, booking.getRefundAmount());
        assertNotNull(booking.getRazorpayRefundId());

        verify(bookingRepository, atLeastOnce()).save(booking);
        verify(bookingTimelineService).recordTimeline(
                eq(booking),
                eq("CANCELLED"),
                contains("Auto-Cancelled"),
                any(),
                any(),
                any(),
                any()
        );
    }

    @Test
    void testCancelOverdueNoShowBookingWithPaidAmountProcessesRefund() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = Booking.builder()
                .user(testUser)
                .bookingCode("GN-TEST02")
                .scheduledAt(LocalDateTime.now().minusMinutes(150))
                .status(BookingStatus.NO_SHOW)
                .pricePaid(450.0)
                .build();
        booking.setId(bookingId);

        when(bookingRepository.findOverdueBookingsForCancellation(any(LocalDateTime.class)))
                .thenReturn(List.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        schedulerService.cancelOverdueBookings();

        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        assertTrue(booking.getAutoCancelled());
        assertEquals("PROCESSED", booking.getRefundStatus());
        assertEquals(450.0, booking.getRefundAmount());
    }

    @Test
    void testCancelOverduePendingBookingWithNoPayment() {
        UUID bookingId = UUID.randomUUID();
        Payment payment = Payment.builder()
                .paymentMethod(PaymentMethod.CASH)
                .status(PaymentStatus.PENDING)
                .build();

        Booking booking = Booking.builder()
                .user(testUser)
                .bookingCode("GN-TEST03")
                .scheduledAt(LocalDateTime.now().minusHours(4))
                .status(BookingStatus.PENDING)
                .payment(payment)
                .pricePaid(0.0)
                .build();
        booking.setId(bookingId);

        when(bookingRepository.findOverdueBookingsForCancellation(any(LocalDateTime.class)))
                .thenReturn(List.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        schedulerService.cancelOverdueBookings();

        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        assertEquals("NONE", booking.getRefundStatus());
        assertEquals(0.0, booking.getRefundAmount());
        assertEquals(PaymentStatus.FAILED, payment.getStatus());
    }

    @Test
    void testSkipCheckedInOrInProgressBookingsEvenIfOverdue() {
        Booking checkedInBooking = Booking.builder()
                .user(testUser)
                .scheduledAt(LocalDateTime.now().minusHours(3))
                .status(BookingStatus.CHECKED_IN)
                .checkedInAt(LocalDateTime.now().minusHours(2))
                .pricePaid(600.0)
                .build();

        when(bookingRepository.findOverdueBookingsForCancellation(any(LocalDateTime.class)))
                .thenReturn(List.of(checkedInBooking));

        schedulerService.cancelOverdueBookings();

        assertEquals(BookingStatus.CHECKED_IN, checkedInBooking.getStatus());
        verify(bookingRepository, never()).save(checkedInBooking);
    }
}
