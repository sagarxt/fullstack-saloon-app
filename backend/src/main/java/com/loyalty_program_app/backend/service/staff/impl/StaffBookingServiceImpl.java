package com.loyalty_program_app.backend.service.staff.impl;

import com.loyalty_program_app.backend.dto.booking.BookingItemDetailsResponse;
import com.loyalty_program_app.backend.dto.booking.BookingItemResponse;
import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.booking.CustomerUpdateBookingRequest;
import com.loyalty_program_app.backend.dto.staff.StaffCreateBookingRequest;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.model.*;
import com.loyalty_program_app.backend.repository.*;
import com.loyalty_program_app.backend.service.staff.StaffBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffBookingServiceImpl implements StaffBookingService {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final BookingRepository bookingRepository;
    private final CouponRepository couponRepository;
    private final StoreRepository storeRepository;
    private final NotificationRepository notificationRepository;
    private final BookingItemRepository bookingItemRepository;
    private final BookingProductRepository bookingProductRepository;
    private final com.loyalty_program_app.backend.service.BookingTimelineService bookingTimelineService;
    private final com.loyalty_program_app.backend.service.BranchCatalogService branchCatalogService;

    @Override
    public BookingResponse createBookingForCustomer(UUID staffId, StaffCreateBookingRequest request) {

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (request.getServiceIds() == null || request.getServiceIds().isEmpty()) {
            throw new RuntimeException("No services selected");
        }

        List<ServiceEntity> services = serviceRepository.findAllById(request.getServiceIds());
        if (services.size() != request.getServiceIds().size()) {
            throw new RuntimeException("One or more services not found");
        }

        Store store = staff.getStore();
        if (store == null && request.getStoreId() != null) {
            store = storeRepository.findById(request.getStoreId()).orElse(null);
        }
        if (store == null) {
            store = storeRepository.findAllByActiveTrueOrderByCreatedAtAsc().stream().findFirst().orElse(null);
        }

        if (store != null) {
            for (ServiceEntity s : services) {
                if (!branchCatalogService.isServiceAvailableAtStore(store.getId(), s.getId())) {
                    throw new RuntimeException("Service '" + s.getName() + "' is currently disabled or unavailable at " + store.getName() + ".");
                }
            }
        }

        LocalDateTime scheduledAt = LocalDateTime.parse(request.getScheduledAt());
        if (scheduledAt.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Selected appointment slot cannot be in the past. Please select an upcoming slot.");
        }

        Booking booking = new Booking();
        booking.setUser(customer);
        booking.setStore(store);
        if (store != null) {
            booking.setStoreNameSnapshot(store.getName());
            booking.setStoreAddressSnapshot(store.getAddress() + ", " + store.getCity());
        }
        booking.setBookingCode(com.loyalty_program_app.backend.util.BookingCodeGenerator.generateUniqueCode(bookingRepository));
        booking.setScheduledAt(scheduledAt);
        booking.setStatus(BookingStatus.PENDING);
        booking.setNote(request.getNote());
        booking.setBookedBy("BOOKED_BY_STAFF - " + staff.getName());
        booking.setCreatedAt(LocalDateTime.now());

        List<BookingItem> items = new ArrayList<>();
        double totalAmount = 0;

        for (ServiceEntity s : services) {
            BookingItem item = new BookingItem();
            item.setBooking(booking);
            item.setService(s);
            item.setServiceNameSnapshot(s.getName());
            item.setServicePriceSnapshot(s.getPrice());
            item.setServiceDurationSnapshot(s.getDurationMinutes());
            item.setStatus(BookingStatus.PENDING);

            items.add(item);
            totalAmount += s.getPrice();
        }

        booking.setBookingItems(items);
        booking.setTotalAmount(totalAmount);

        double pricePaid = totalAmount;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(request.getCouponCode())
                    .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

            if (!coupon.isActive() || coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Coupon inactive or expired");
            }
            if (totalAmount < coupon.getMinAmount()) {
                throw new RuntimeException("Minimum amount for coupon is: " + coupon.getMinAmount());
            }

            double discount = coupon.getDiscount();
            if (coupon.getMaxDiscount() != null && discount > coupon.getMaxDiscount()) {
                discount = coupon.getMaxDiscount();
            }

            pricePaid = Math.max(totalAmount - discount, 0);
            booking.setCoupon(coupon);
        }

        booking.setPricePaid(pricePaid);

        Booking saved = bookingRepository.save(booking);

        bookingTimelineService.recordTimeline(
                saved,
                "CREATED",
                "Walk-In Appointment Created",
                "Appointment registered for " + customer.getName() + " by stylist " + staff.getName() + " with " + services.size() + " service(s).",
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        return toDto(saved);
    }

    @Override
    public BookingResponse updateBookingForCustomer(UUID staffId, UUID bookingId, CustomerUpdateBookingRequest request) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot modify completed/cancelled booking");
        }

        if (request.getScheduledAt() != null) {
            LocalDateTime newScheduledAt = LocalDateTime.parse(request.getScheduledAt());
            if (newScheduledAt.isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Selected appointment slot cannot be in the past. Please select an upcoming slot.");
            }
            booking.setScheduledAt(newScheduledAt);
        }
        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        booking.setStatus(BookingStatus.MODIFIED);
        booking.setBookedBy("MODIFIED_BY_STAFF - " + staff.getName());

        Booking saved = bookingRepository.save(booking);

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Appointment Rescheduled")
                    .message("Your appointment (" + displayCode + ") has been rescheduled to " + saved.getScheduledAt() + " by salon stylist " + staff.getName() + ".")
                    .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
                    .build();
            notificationRepository.save(notif);
        }

        String updateDesc = (request.getScheduledAt() != null ? "Rescheduled slot to " + request.getScheduledAt() + ". " : "")
                + (request.getNote() != null ? "Note: " + request.getNote() : "");
        bookingTimelineService.recordTimeline(
                saved,
                "MODIFIED",
                "Appointment Updated by Stylist",
                updateDesc.isBlank() ? "Appointment updated by stylist " + staff.getName() : updateDesc,
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        return toDto(saved);
    }

    @Override
    public BookingResponse cancelBookingForCustomer(UUID staffId, UUID bookingId, String note) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        if (note != null && !note.isBlank()) {
            booking.setNote(note);
        }

        booking.setBookedBy("MODIFIED_BY_STAFF - " + staff.getName());

        Booking saved = bookingRepository.save(booking);

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Appointment Cancelled")
                    .message("Your appointment (" + displayCode + ") was cancelled by salon stylist " + staff.getName() + (note != null && !note.isBlank() ? " (" + note + ")" : "."))
                    .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
                    .build();
            notificationRepository.save(notif);
        }

        bookingTimelineService.recordTimeline(
                saved,
                "CANCELLED",
                "Appointment Cancelled by Stylist",
                "Appointment cancelled by stylist " + staff.getName() + (note != null && !note.isBlank() ? ". Reason: " + note : "."),
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        return toDto(saved);
    }

    @Override
    public Page<BookingResponse> getCustomerBookings(UUID customerId, Pageable pageable) {
        Page<Booking> page = bookingRepository.findAll(pageable);

        var filtered = page.getContent().stream()
                .filter(b -> b.getUser().getId().equals(customerId))
                .map(this::toDto)
                .collect(Collectors.toList());

        return new PageImpl<>(filtered, pageable, filtered.size());
    }

    @Override
    public BookingResponse getBooking(UUID bookingId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return toDto(b);
    }

    @Override
    public BookingResponse addServiceToBooking(UUID staffId, UUID bookingId, UUID serviceId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot add service to " + booking.getStatus() + " booking");
        }

        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        if (booking.getStore() != null && !branchCatalogService.isServiceAvailableAtStore(booking.getStore().getId(), service.getId())) {
            throw new RuntimeException("Service '" + service.getName() + "' is currently disabled or unavailable at " + booking.getStore().getName() + ".");
        }

        BookingItem item = new BookingItem();
        item.setBooking(booking);
        item.setService(service);
        item.setServiceNameSnapshot(service.getName());
        item.setServicePriceSnapshot(service.getPrice());
        item.setServiceDurationSnapshot(service.getDurationMinutes());
        item.setStatus(booking.getStatus());
        bookingItemRepository.save(item);

        if (booking.getBookingItems() == null) {
            booking.setBookingItems(new ArrayList<>());
        }
        booking.getBookingItems().add(item);

        recalculateBookingTotals(booking);
        booking.setStatus(BookingStatus.MODIFIED);
        booking.setBookedBy("MODIFIED_BY_STAFF - " + staff.getName());
        Booking saved = bookingRepository.save(booking);

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Service Added by Stylist")
                    .message("Stylist " + staff.getName() + " added " + service.getName() + " to your appointment (" + displayCode + ").")
                    .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
                    .build();
            notificationRepository.save(notif);
        }

        bookingTimelineService.recordTimeline(
                saved,
                "SERVICE_ADDED",
                "Service Added by Stylist",
                "Stylist " + staff.getName() + " added " + service.getName() + " (₹" + service.getPrice() + ", " + service.getDurationMinutes() + " mins) to appointment.",
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        return toDto(saved);
    }

    @Override
    public BookingResponse removeServiceFromBooking(UUID staffId, UUID bookingId, UUID itemId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot remove service from " + booking.getStatus() + " booking");
        }

        if (booking.getBookingItems() == null || booking.getBookingItems().size() <= 1) {
            throw new RuntimeException("Cannot remove the only service in this appointment. Please cancel the appointment if needed.");
        }

        BookingItem itemToRemove = booking.getBookingItems().stream()
                .filter(it -> it.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Service item not found in booking"));

        String removedServiceName = itemToRemove.getServiceNameSnapshot();
        booking.getBookingItems().remove(itemToRemove);
        bookingItemRepository.delete(itemToRemove);

        recalculateBookingTotals(booking);
        booking.setStatus(BookingStatus.MODIFIED);
        booking.setBookedBy("MODIFIED_BY_STAFF - " + staff.getName());
        Booking saved = bookingRepository.save(booking);

        if (saved.getUser() != null) {
            String displayCode = saved.getBookingCode() != null ? saved.getBookingCode() : "GN-" + saved.getId().toString().substring(0, 8).toUpperCase();
            Notification notif = Notification.builder()
                    .user(saved.getUser())
                    .title("Service Removed by Stylist")
                    .message("Stylist " + staff.getName() + " removed " + removedServiceName + " from your appointment (" + displayCode + ").")
                    .type(com.loyalty_program_app.backend.enums.NotificationType.BOOKING)
                    .build();
            notificationRepository.save(notif);
        }

        bookingTimelineService.recordTimeline(
                saved,
                "SERVICE_REMOVED",
                "Service Removed by Stylist",
                "Stylist " + staff.getName() + " removed " + removedServiceName + " from appointment.",
                staff.getName(),
                "STAFF",
                staff.getEmail()
        );

        return toDto(saved);
    }

    private void recalculateBookingTotals(Booking booking) {
        double servicesTotal = 0.0;
        int totalDuration = 0;
        if (booking.getBookingItems() != null) {
            for (BookingItem item : booking.getBookingItems()) {
                if (item.getServicePriceSnapshot() != null) {
                    servicesTotal += item.getServicePriceSnapshot();
                }
                if (item.getServiceDurationSnapshot() != null) {
                    totalDuration += item.getServiceDurationSnapshot();
                }
            }
        }

        double productsTotal = 0.0;
        List<BookingProduct> bProducts = bookingProductRepository.findByBookingId(booking.getId());
        if (bProducts != null) {
            for (BookingProduct bp : bProducts) {
                if (bp.getTotalPrice() != null) {
                    productsTotal += bp.getTotalPrice();
                }
            }
        }

        double totalAmount = servicesTotal + productsTotal;
        double discount = 0.0;
        if (booking.getCoupon() != null) {
            Coupon coupon = booking.getCoupon();
            if (coupon.isActive() && !coupon.getExpiryDate().isBefore(LocalDateTime.now()) && totalAmount >= (coupon.getMinAmount() != null ? coupon.getMinAmount() : 0.0)) {
                discount = coupon.getDiscount() != null ? coupon.getDiscount() : 0.0;
                if (coupon.getMaxDiscount() != null && discount > coupon.getMaxDiscount()) {
                    discount = coupon.getMaxDiscount();
                }
            }
        }

        double pricePaid = Math.max(0.0, totalAmount - discount);
        booking.setTotalAmount(totalAmount);
        booking.setPricePaid(pricePaid);
        booking.setTotalDurationMinutes(totalDuration);
    }

    private BookingResponse toDto(Booking b) {
        BookingResponse dto = new BookingResponse();
        dto.setId(b.getId());
        dto.setBookingCode(b.getBookingCode() != null ? b.getBookingCode() : "GN-" + b.getId().toString().substring(0, 8).toUpperCase());
        dto.setUserId(b.getUser() != null ? b.getUser().getId() : null);
        dto.setUserName(b.getUser() != null ? b.getUser().getName() : null);
        dto.setPaymentId(b.getPayment() != null ? b.getPayment().getId() : null);
        dto.setCouponId(b.getCoupon() != null ? b.getCoupon().getId() : null);
        dto.setTotalAmount(b.getTotalAmount());
        dto.setPricePaid(b.getPricePaid());
        dto.setStatus(b.getStatus().name());
        dto.setScheduledAt(b.getScheduledAt() != null ? b.getScheduledAt() : null);
        dto.setNote(b.getNote());
        dto.setBookedBy(b.getBookedBy());

        if (b.getStore() != null) {
            dto.setStoreId(b.getStore().getId());
            dto.setStoreName(b.getStoreNameSnapshot() != null ? b.getStoreNameSnapshot() : b.getStore().getName());
            dto.setStoreAddress(b.getStoreAddressSnapshot() != null ? b.getStoreAddressSnapshot() : b.getStore().getAddress());
        } else if (b.getStoreNameSnapshot() != null) {
            dto.setStoreName(b.getStoreNameSnapshot());
            dto.setStoreAddress(b.getStoreAddressSnapshot());
        }

        if (b.getBookingItems() != null && !b.getBookingItems().isEmpty()) {
            BookingItem first = b.getBookingItems().get(0);
            dto.setServiceId(first.getService() != null ? first.getService().getId() : null);
            dto.setServiceName(first.getServiceNameSnapshot());

            dto.setItems(b.getBookingItems().stream().map(it -> {
                BookingItemDetailsResponse itDto = new BookingItemDetailsResponse();
                itDto.setId(it.getId());
                itDto.setServiceId(it.getService() != null ? it.getService().getId() : null);
                itDto.setServiceName(it.getServiceNameSnapshot());
                itDto.setPrice(it.getServicePriceSnapshot());
                itDto.setDurationMinutes(it.getServiceDurationSnapshot());
                itDto.setStatus(it.getStatus() != null ? it.getStatus().name() : null);
                return itDto;
            }).collect(Collectors.toList()));
        } else {
            dto.setItems(new ArrayList<>());
        }

        List<BookingProduct> prods = bookingProductRepository.findByBookingId(b.getId());
        if (prods != null && !prods.isEmpty()) {
            dto.setProducts(prods.stream().map(bp -> com.loyalty_program_app.backend.dto.product.BookingProductResponse.builder()
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

        dto.setTimeline(bookingTimelineService.getTimelineForBooking(b));

        return dto;
    }
}
