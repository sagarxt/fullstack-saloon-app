package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.booking.BookingItemDetailsResponse;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.booking.BookingUpdateRequest;
import com.loyalty_program_app.backend.dto.product.BookingProductResponse;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.enums.PaymentMethod;
import com.loyalty_program_app.backend.enums.PaymentStatus;
import com.loyalty_program_app.backend.enums.PointReason;
import com.loyalty_program_app.backend.model.*;
import com.loyalty_program_app.backend.repository.*;
import com.loyalty_program_app.backend.service.admin.BookingAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingAdminServiceImpl implements BookingAdminService {

    private final BookingRepository bookingRepository;
    private final BookingItemRepository bookingItemRepository;
    private final BookingProductRepository bookingProductRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final com.loyalty_program_app.backend.service.BookingTimelineService bookingTimelineService;

    // ===================== ADVANCED SEARCH =====================
    @Override
    public Page<BookingResponse> searchBookings(
            String bookingId,
            String customerName,
            String customerEmail,
            String status,
            UUID storeId,
            String fromDate,
            String toDate,
            Pageable pageable
    ) {
        Specification<Booking> spec = Specification.allOf();

        if (bookingId != null && !bookingId.isBlank()) {
            final String q = bookingId.trim().toLowerCase();
            spec = spec.and((root, query, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("id").as(String.class)), "%" + q + "%"),
                            cb.like(cb.lower(root.get("bookingCode")), "%" + q + "%")
                    )
            );
        }

        if (customerName != null && !customerName.isBlank()) {
            final String cName = customerName.trim().toLowerCase();
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.join("user").get("name")), "%" + cName + "%")
            );
        }

        if (customerEmail != null && !customerEmail.isBlank()) {
            final String cEmail = customerEmail.trim().toLowerCase();
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.join("user").get("email")), "%" + cEmail + "%")
            );
        }

        if (status != null && !status.isBlank()) {
            final String st = status.trim().toUpperCase();
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), BookingStatus.valueOf(st))
            );
        }

        if (storeId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("store").get("id"), storeId)
            );
        }

        if (fromDate != null && !fromDate.isBlank()) {
            LocalDateTime from = parseDate(fromDate).atStartOfDay();
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("scheduledAt"), from)
            );
        }

        if (toDate != null && !toDate.isBlank()) {
            LocalDateTime to = parseDate(toDate).atTime(23, 59, 59);
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("scheduledAt"), to)
            );
        }

        Page<Booking> page = bookingRepository.findAll(spec, pageable);
        return page.map(this::toBookingResponse);
    }

    // ===================== GET ONE BOOKING =====================
    @Override
    public BookingResponse getBookingById(UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return toBookingResponse(booking);
    }

    // ===================== UPDATE BOOKING =====================
    @Override
    public BookingResponse updateBooking(UUID id, BookingUpdateRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (request.getScheduledAt() != null && !request.getScheduledAt().isBlank()) {
            try {
                LocalDateTime newTime = LocalDateTime.parse(request.getScheduledAt());
                booking.setScheduledAt(newTime);
                booking.setStatus(BookingStatus.MODIFIED);
            } catch (DateTimeParseException e) {
                throw new RuntimeException("Invalid scheduledAt format. Use ISO format: 2026-10-20T15:30:00");
            }
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            BookingStatus newStatus = BookingStatus.valueOf(request.getStatus().trim().toUpperCase());
            booking.setStatus(newStatus);
            if (booking.getBookingItems() != null) {
                for (BookingItem bi : booking.getBookingItems()) {
                    bi.setStatus(newStatus);
                    bookingItemRepository.save(bi);
                }
            }

            if (newStatus == BookingStatus.CANCELLED) {
                booking.setCancelledAt(LocalDateTime.now());
                if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.PENDING) {
                    booking.getPayment().setStatus(PaymentStatus.CANCELLED);
                    paymentRepository.save(booking.getPayment());
                }
            } else if (newStatus == BookingStatus.COMPLETED) {
                booking.setCompletedAt(LocalDateTime.now());

                // Auto-confirm payment if cash or pending
                Payment p = booking.getPayment();
                if (p == null) {
                    double finalPrice = booking.getPricePaid() != null ? booking.getPricePaid() : (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0);
                    p = Payment.builder()
                            .user(booking.getUser())
                            .amount(finalPrice)
                            .paymentMethod(PaymentMethod.CASH)
                            .status(PaymentStatus.COMPLETED)
                            .invoiceNumber("INV-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100))
                            .build();
                    p = paymentRepository.save(p);
                    booking.setPayment(p);
                    booking.setPricePaid(finalPrice);
                } else if (p.getStatus() == PaymentStatus.PENDING) {
                    p.setStatus(PaymentStatus.COMPLETED);
                    paymentRepository.save(p);
                }

                // Award points if not already awarded
                if (booking.getUser() != null) {
                    boolean alreadyAwarded = pointsLedgerRepository.existsByRelatedId(booking.getId());
                    if (!alreadyAwarded) {
                        User customer = booking.getUser();
                        double amount = booking.getPricePaid() != null ? booking.getPricePaid() : (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0);
                        double multiplier = 1.0;
                        if (customer.getTier() != null) {
                            switch (customer.getTier()) {
                                case DIAMOND -> multiplier = 2.0;
                                case PLATINUM -> multiplier = 1.5;
                                case GOLD -> multiplier = 1.25;
                                case SILVER -> multiplier = 1.0;
                            }
                        }
                        int earned = Math.max(1, (int) Math.round((amount / 100.0) * multiplier));
                        customer.setPoints((customer.getPoints() != null ? customer.getPoints() : 0) + earned);
                        int lifetime = (customer.getLifetimePoints() != null ? customer.getLifetimePoints() : 0) + earned;
                        customer.setLifetimePoints(lifetime);
                        if (lifetime >= 300) customer.setTier(com.loyalty_program_app.backend.enums.Tier.DIAMOND);
                        else if (lifetime >= 150) customer.setTier(com.loyalty_program_app.backend.enums.Tier.PLATINUM);
                        else if (lifetime >= 50) customer.setTier(com.loyalty_program_app.backend.enums.Tier.GOLD);
                        userRepository.save(customer);

                        PointsLedger ledger = new PointsLedger();
                        ledger.setUser(customer);
                        ledger.setChangeAmount(earned);
                        ledger.setReason(PointReason.BOOKING_COMPLETED);
                        ledger.setRelatedId(booking.getId());
                        ledger.setNote("Appointment " + booking.getBookingCode() + " completed");
                        pointsLedgerRepository.save(ledger);
                    }
                }
            }
        }

        // Payment status/method override
        if (request.getPaymentStatus() != null && !request.getPaymentStatus().isBlank()) {
            String psRaw = request.getPaymentStatus().trim().toUpperCase();
            if (psRaw.equals("SUCCESS") || psRaw.equals("PAID")) {
                psRaw = "COMPLETED";
            }
            PaymentStatus pStatus = PaymentStatus.valueOf(psRaw);
            Payment p = booking.getPayment();
            if (p == null) {
                p = Payment.builder()
                        .user(booking.getUser())
                        .amount(booking.getPricePaid() != null ? booking.getPricePaid() : (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0))
                        .paymentMethod(PaymentMethod.CASH)
                        .status(pStatus)
                        .invoiceNumber("INV-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100))
                        .build();
            } else {
                p.setStatus(pStatus);
            }
            p = paymentRepository.save(p);
            booking.setPayment(p);

            // If payment is completed and booking was pending, transition to CONFIRMED
            if (pStatus == PaymentStatus.COMPLETED && booking.getStatus() == BookingStatus.PENDING) {
                booking.setStatus(BookingStatus.CONFIRMED);
                if (booking.getBookingItems() != null) {
                    for (BookingItem bi : booking.getBookingItems()) {
                        if (bi.getStatus() == BookingStatus.PENDING) {
                            bi.setStatus(BookingStatus.CONFIRMED);
                            bookingItemRepository.save(bi);
                        }
                    }
                }
            }
        }

        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            PaymentMethod pMethod = PaymentMethod.valueOf(request.getPaymentMethod().trim().toUpperCase());
            Payment p = booking.getPayment();
            if (p == null) {
                p = Payment.builder()
                        .user(booking.getUser())
                        .amount(booking.getPricePaid() != null ? booking.getPricePaid() : (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0))
                        .paymentMethod(pMethod)
                        .status(PaymentStatus.PENDING)
                        .invoiceNumber("INV-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100))
                        .build();
            } else {
                p.setPaymentMethod(pMethod);
            }
            p = paymentRepository.save(p);
            booking.setPayment(p);
        }

        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        if (request.getTotalAmount() != null) {
            booking.setTotalAmount(request.getTotalAmount());
        }

        if (request.getPricePaid() != null) {
            booking.setPricePaid(request.getPricePaid());
            if (booking.getPayment() != null) {
                booking.getPayment().setAmount(request.getPricePaid());
                paymentRepository.save(booking.getPayment());
            }
        }

        Booking saved = bookingRepository.save(booking);

        StringBuilder desc = new StringBuilder("Admin updated booking:");
        if (request.getStatus() != null) desc.append(" status=").append(request.getStatus());
        if (request.getScheduledAt() != null) desc.append(" scheduledAt=").append(request.getScheduledAt());
        if (request.getPaymentStatus() != null) desc.append(" paymentStatus=").append(request.getPaymentStatus());
        if (request.getPricePaid() != null) desc.append(" pricePaid=₹").append(request.getPricePaid());

        bookingTimelineService.recordTimeline(
                saved,
                "MODIFIED",
                "Booking Modified by Admin",
                desc.toString(),
                "Admin Staff",
                "ADMIN",
                null
        );

        return toBookingResponse(saved);
    }

    // ===================== CANCEL BOOKING =====================
    @Override
    public BookingResponse cancelBooking(UUID id, String note) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        if (booking.getBookingItems() != null) {
            for (BookingItem bi : booking.getBookingItems()) {
                bi.setStatus(BookingStatus.CANCELLED);
                bookingItemRepository.save(bi);
            }
        }

        if (note != null && !note.isBlank()) {
            booking.setNote(note);
        }

        if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.PENDING) {
            booking.getPayment().setStatus(PaymentStatus.CANCELLED);
            paymentRepository.save(booking.getPayment());
        }

        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "CANCELLED",
                "Booking Cancelled by Admin",
                "Booking was cancelled by administrative staff." + (note != null && !note.isBlank() ? " Reason: " + note : ""),
                "Admin Staff",
                "ADMIN",
                null
        );

        return toBookingResponse(saved);
    }

    // ===================== UTIL METHODS =====================
    private LocalDate parseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr);
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format. Use yyyy-MM-dd");
        }
    }

    private BookingResponse toBookingResponse(Booking b) {
        BookingResponse dto = new BookingResponse();
        dto.setId(b.getId());
        dto.setBookingCode(b.getBookingCode() != null ? b.getBookingCode() : "GN-" + b.getId().toString().substring(0, 8).toUpperCase());

        if (b.getUser() != null) {
            dto.setUserId(b.getUser().getId());
            dto.setUserName(b.getUser().getName());
            dto.setUserEmail(b.getUser().getEmail());
            dto.setUserPhone(b.getUser().getPhone());
        }

        dto.setPaymentId(b.getPayment() != null ? b.getPayment().getId() : null);
        dto.setCouponId(b.getCoupon() != null ? b.getCoupon().getId() : null);
        dto.setTotalAmount(b.getTotalAmount());
        dto.setPricePaid(b.getPricePaid() != null ? b.getPricePaid() : b.getTotalAmount());
        dto.setStatus(b.getStatus().name());
        dto.setScheduledAt(b.getScheduledAt() != null ? b.getScheduledAt() : null);
        dto.setNote(b.getNote());
        dto.setBookedBy(b.getBookedBy());

        if (b.getPayment() != null) {
            dto.setPaymentMethod(b.getPayment().getPaymentMethod() != null ? b.getPayment().getPaymentMethod().name() : "CASH");
            if (b.getStatus() == BookingStatus.COMPLETED) {
                dto.setPaymentStatus("COMPLETED");
            } else if (b.getStatus() == BookingStatus.CANCELLED) {
                if (b.getPayment().getPaymentMethod() == PaymentMethod.CASH || b.getPayment().getStatus() == PaymentStatus.PENDING) {
                    dto.setPaymentStatus("CANCELLED");
                } else {
                    dto.setPaymentStatus(b.getPayment().getStatus().name());
                }
            } else {
                dto.setPaymentStatus(b.getPayment().getStatus() != null ? b.getPayment().getStatus().name() : "PENDING");
            }
        } else {
            dto.setPaymentMethod("CASH");
            if (b.getStatus() == BookingStatus.COMPLETED) {
                dto.setPaymentStatus("COMPLETED");
            } else if (b.getStatus() == BookingStatus.CANCELLED) {
                dto.setPaymentStatus("CANCELLED");
            } else {
                dto.setPaymentStatus("PENDING");
            }
        }

        if (b.getStore() != null) {
            dto.setStoreId(b.getStore().getId());
            dto.setStoreName(b.getStoreNameSnapshot() != null ? b.getStoreNameSnapshot() : b.getStore().getName());
            dto.setStoreAddress(b.getStoreAddressSnapshot() != null ? b.getStoreAddressSnapshot() : b.getStore().getAddress());
        } else if (b.getStoreNameSnapshot() != null) {
            dto.setStoreName(b.getStoreNameSnapshot());
            dto.setStoreAddress(b.getStoreAddressSnapshot());
        }

        // Map items safely
        List<BookingItem> items = b.getBookingItems();
        if ((items == null || items.isEmpty()) && bookingItemRepository != null) {
            items = bookingItemRepository.findByBookingId(b.getId());
        }
        if (items != null && !items.isEmpty()) {
            dto.setItems(items.stream().map(this::toBookingItemDetailsResponse).collect(Collectors.toList()));
            dto.setServiceName(items.get(0).getServiceNameSnapshot());
            dto.setServiceId(items.get(0).getService() != null ? items.get(0).getService().getId() : null);
        } else {
            dto.setItems(new ArrayList<>());
        }

        // Map products safely
        List<BookingProduct> prods = bookingProductRepository != null ? bookingProductRepository.findByBookingId(b.getId()) : null;
        if (prods != null && !prods.isEmpty()) {
            dto.setProducts(prods.stream().map(bp -> BookingProductResponse.builder()
                    .id(bp.getId())
                    .productId(bp.getProduct() != null ? bp.getProduct().getId() : null)
                    .productName(bp.getProductNameSnapshot())
                    .brand(bp.getProduct() != null ? bp.getProduct().getBrand() : null)
                    .volumeOrSize(bp.getProduct() != null ? bp.getProduct().getVolumeOrSize() : null)
                    .image(bp.getProduct() != null ? bp.getProduct().getImage() : null)
                    .unitPrice(bp.getUnitPriceSnapshot())
                    .quantity(bp.getQuantity())
                    .totalPrice(bp.getTotalPrice())
                    .build()).collect(Collectors.toList()));
        } else {
            dto.setProducts(new ArrayList<>());
        }

        double pAmount = dto.getPricePaid() != null ? dto.getPricePaid() : 0.0;
        double multiplier = 1.0;
        if (b.getUser() != null && b.getUser().getTier() != null) {
            switch (b.getUser().getTier()) {
                case DIAMOND -> multiplier = 2.0;
                case PLATINUM -> multiplier = 1.5;
                case GOLD -> multiplier = 1.25;
                case SILVER -> multiplier = 1.0;
            }
        }
        dto.setExpectedRewardPoints(Math.max(1, (int) Math.round((pAmount / 100.0) * multiplier)));
        dto.setPointsConfirmed(b.getStatus() == BookingStatus.COMPLETED);
        dto.setTimeline(bookingTimelineService.getTimelineForBooking(b));

        return dto;
    }

    private BookingItemDetailsResponse toBookingItemDetailsResponse(BookingItem item) {
        BookingItemDetailsResponse dto = new BookingItemDetailsResponse();
        dto.setId(item.getId());
        dto.setServiceId(item.getService() != null ? item.getService().getId() : null);
        dto.setServiceName(item.getServiceNameSnapshot() != null ? item.getServiceNameSnapshot() : (item.getService() != null ? item.getService().getName() : "Salon Service"));
        dto.setPrice(item.getServicePriceSnapshot() != null ? item.getServicePriceSnapshot() : (item.getService() != null ? item.getService().getPrice() : 0.0));
        dto.setDurationMinutes(item.getServiceDurationSnapshot() != null ? item.getServiceDurationSnapshot() : (item.getService() != null ? item.getService().getDurationMinutes() : 30));
        dto.setStatus(item.getStatus() != null ? item.getStatus().name() : "PENDING");
        return dto;
    }
}
