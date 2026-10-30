package com.groomish_now.backend.mapper;

import com.groomish_now.backend.dto.booking.BookingItemDetailsResponse;
import com.groomish_now.backend.dto.booking.BookingResponse;
import com.groomish_now.backend.dto.booking.BookingTimelineResponse;
import com.groomish_now.backend.dto.product.BookingProductResponse;
import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.enums.PaymentMethod;
import com.groomish_now.backend.enums.PaymentStatus;
import com.groomish_now.backend.model.Booking;
import com.groomish_now.backend.model.BookingItem;
import com.groomish_now.backend.model.BookingProduct;
import com.groomish_now.backend.model.BookingTimeline;
import com.groomish_now.backend.model.PointsLedger;
import com.groomish_now.backend.model.SubService;
import com.groomish_now.backend.repository.BookingItemRepository;
import com.groomish_now.backend.repository.BookingProductRepository;
import com.groomish_now.backend.repository.BookingTimelineRepository;
import com.groomish_now.backend.repository.PointsLedgerRepository;
import com.groomish_now.backend.service.booking.BookingTimelineService;
import com.groomish_now.backend.service.loyalty.LoyaltyConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingMapper {

    private final BookingItemRepository bookingItemRepository;
    private final BookingProductRepository bookingProductRepository;
    private final BookingTimelineRepository bookingTimelineRepository;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final BookingTimelineService bookingTimelineService;
    private final LoyaltyConfigService loyaltyConfigService;

    public BookingResponse toBookingResponse(Booking b) {
        if (b == null) {
            return null;
        }

        List<BookingProduct> prods = bookingProductRepository != null ? bookingProductRepository.findByBookingId(b.getId()) : Collections.emptyList();
        List<PointsLedger> ledgers = (b.getStatus() == BookingStatus.COMPLETED && pointsLedgerRepository != null)
                ? pointsLedgerRepository.findByRelatedId(b.getId())
                : Collections.emptyList();
        List<BookingTimelineResponse> timeline = bookingTimelineService != null
                ? bookingTimelineService.getTimelineForBooking(b)
                : Collections.emptyList();

        return buildBookingResponse(b, prods, ledgers, timeline);
    }

    public List<BookingResponse> toBookingResponseList(List<Booking> bookings) {
        if (bookings == null || bookings.isEmpty()) {
            return Collections.emptyList();
        }

        // Batch pre-fetch all products, points ledgers, and timelines in single queries to prevent N+1 queries
        List<UUID> bookingIds = bookings.stream().map(Booking::getId).filter(Objects::nonNull).distinct().toList();

        Map<UUID, List<BookingProduct>> productMap = new HashMap<>();
        if (bookingProductRepository != null && !bookingIds.isEmpty()) {
            List<BookingProduct> allProds = bookingProductRepository.findByBookingIdIn(bookingIds);
            if (allProds != null) {
                for (BookingProduct bp : allProds) {
                    if (bp.getBooking() != null && bp.getBooking().getId() != null) {
                        productMap.computeIfAbsent(bp.getBooking().getId(), k -> new ArrayList<>()).add(bp);
                    }
                }
            }
        }

        Map<UUID, List<PointsLedger>> ledgerMap = new HashMap<>();
        if (pointsLedgerRepository != null && !bookingIds.isEmpty()) {
            List<PointsLedger> allLedgers = pointsLedgerRepository.findByRelatedIdIn(bookingIds);
            if (allLedgers != null) {
                for (PointsLedger pl : allLedgers) {
                    if (pl.getRelatedId() != null) {
                        ledgerMap.computeIfAbsent(pl.getRelatedId(), k -> new ArrayList<>()).add(pl);
                    }
                }
            }
        }

        Map<UUID, List<BookingTimelineResponse>> timelineMap = new HashMap<>();
        if (bookingTimelineRepository != null && !bookingIds.isEmpty()) {
            List<BookingTimeline> allTimelines = bookingTimelineRepository.findByBookingIdInOrderByCreatedAtAsc(bookingIds);
            if (allTimelines != null) {
                for (BookingTimeline bt : allTimelines) {
                    if (bt.getBooking() != null && bt.getBooking().getId() != null) {
                        BookingTimelineResponse tr = BookingTimelineResponse.builder()
                                .id(bt.getId())
                                .action(bt.getAction())
                                .title(bt.getTitle())
                                .description(bt.getDescription())
                                .performedBy(bt.getPerformedBy())
                                .performedByRole(bt.getPerformedByRole())
                                .performedByEmail(bt.getPerformedByEmail())
                                .createdAt(bt.getCreatedAt())
                                .build();
                        timelineMap.computeIfAbsent(bt.getBooking().getId(), k -> new ArrayList<>()).add(tr);
                    }
                }
            }
        }

        List<BookingResponse> result = new ArrayList<>(bookings.size());
        for (Booking b : bookings) {
            List<BookingProduct> bProds = productMap.getOrDefault(b.getId(), Collections.emptyList());
            List<PointsLedger> bLedgers = ledgerMap.getOrDefault(b.getId(), Collections.emptyList());
            List<BookingTimelineResponse> bTimeline = timelineMap.getOrDefault(b.getId(), Collections.emptyList());
            result.add(buildBookingResponse(b, bProds, bLedgers, bTimeline));
        }
        return result;
    }

    private BookingResponse buildBookingResponse(
            Booking b,
            List<BookingProduct> prods,
            List<PointsLedger> ledgers,
            List<BookingTimelineResponse> timeline
    ) {
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
        dto.setCouponCode(b.getCoupon() != null ? b.getCoupon().getCode() : null);
        dto.setCouponApplied(b.getCoupon() != null ? b.getCoupon().getCode() : null);

        // Map items safely (pre-fetch to accurately compute total if totalAmount was uninitialized)
        List<BookingItem> items = b.getBookingItems();
        if ((items == null || items.isEmpty()) && bookingItemRepository != null && b.getId() != null) {
            items = bookingItemRepository.findByBookingId(b.getId());
        }

        Double total = b.getTotalAmount();
        Double paid = b.getPricePaid();
        if (total == null || total <= 0.0) {
            double itemsSum = items != null ? items.stream()
                    .mapToDouble(it -> it.getServicePriceSnapshot() != null && it.getServicePriceSnapshot() > 0 ? it.getServicePriceSnapshot()
                            : (it.getService() != null && it.getService().getPrice() != null ? it.getService().getPrice() : 0.0))
                    .sum() : 0.0;
            double prodsSum = prods != null ? prods.stream()
                    .mapToDouble(p -> p.getTotalPrice() != null && p.getTotalPrice() > 0 ? p.getTotalPrice()
                            : (p.getUnitPriceSnapshot() != null ? p.getUnitPriceSnapshot() * (p.getQuantity() != null ? p.getQuantity() : 1) : 0.0))
                    .sum() : 0.0;
            if (itemsSum + prodsSum > 0.0) {
                total = itemsSum + prodsSum;
            } else if (b.getPayment() != null && b.getPayment().getAmount() != null && b.getPayment().getAmount() > 0.0) {
                total = b.getPayment().getAmount();
            } else if (paid != null && paid > 0.0) {
                total = paid;
            }
        }
        if (total == null) total = 0.0;

        if (b.getPayment() != null && b.getPayment().getStatus() == PaymentStatus.COMPLETED) {
            if (paid == null || paid == 0.0) {
                paid = b.getPayment().getAmount() != null ? b.getPayment().getAmount() : total;
            }
        } else if (b.getPayment() != null && b.getPayment().getStatus() == PaymentStatus.PENDING) {
            if (b.getStatus() != BookingStatus.COMPLETED) {
                paid = 0.0;
            }
        }
        if (paid == null) paid = 0.0;
        Double remaining = Math.max(0.0, total - paid);
        Double refundDue = (b.getRefundDueAmount() != null && b.getRefundDueAmount() > 0)
                ? b.getRefundDueAmount()
                : Math.max(0.0, paid - total);

        dto.setTotalAmount(total);
        dto.setPricePaid(paid);
        dto.setRemainingAmount(remaining);
        dto.setRefundDueAmount(refundDue);
        dto.setStatus(b.getStatus() != null ? b.getStatus().name() : null);
        dto.setScheduledAt(b.getScheduledAt());
        dto.setNote(b.getNote());
        dto.setBookedBy(b.getBookedBy());
        dto.setCheckedInAt(b.getCheckedInAt());
        dto.setCompletedAt(b.getCompletedAt());
        dto.setCancelledAt(b.getCancelledAt());
        dto.setCreatedAt(b.getCreatedAt());

        if (b.getPayment() != null) {
            dto.setPaymentMethod(b.getPayment().getPaymentMethod() != null ? b.getPayment().getPaymentMethod().name() : "CASH");
            dto.setInvoiceNumber(b.getPayment().getInvoiceNumber());
            if (b.getStatus() == BookingStatus.CANCELLED) {
                if (b.getPayment().getPaymentMethod() == PaymentMethod.CASH || b.getPayment().getStatus() == PaymentStatus.PENDING) {
                    dto.setPaymentStatus("CANCELLED");
                } else {
                    dto.setPaymentStatus(b.getPayment().getStatus().name());
                }
            } else if (b.getStatus() == BookingStatus.COMPLETED || (remaining <= 0.01 && paid > 0)) {
                dto.setPaymentStatus("COMPLETED");
            } else if (paid > 0.01 && remaining > 0.01) {
                dto.setPaymentStatus("PARTIALLY_PAID");
            } else {
                dto.setPaymentStatus(b.getPayment().getStatus() != null ? b.getPayment().getStatus().name() : "PENDING");
            }
        } else {
            dto.setPaymentMethod("CASH");
            if (b.getStatus() == BookingStatus.COMPLETED || (remaining <= 0.01 && paid > 0)) {
                dto.setPaymentStatus("COMPLETED");
            } else if (b.getStatus() == BookingStatus.CANCELLED) {
                dto.setPaymentStatus("CANCELLED");
            } else if (paid > 0.01 && remaining > 0.01) {
                dto.setPaymentStatus("PARTIALLY_PAID");
            } else {
                dto.setPaymentStatus("PENDING");
            }
        }

        if (b.getStore() != null) {
            dto.setStoreId(b.getStore().getId());
            dto.setStoreName(b.getStoreNameSnapshot() != null ? b.getStoreNameSnapshot() : b.getStore().getName());
            dto.setStoreAddress(b.getStoreAddressSnapshot() != null ? b.getStoreAddressSnapshot() : b.getStore().getAddress());
            dto.setStoreLatitude(b.getStore().getLatitude());
            dto.setStoreLongitude(b.getStore().getLongitude());
        } else if (b.getStoreNameSnapshot() != null) {
            dto.setStoreName(b.getStoreNameSnapshot());
            dto.setStoreAddress(b.getStoreAddressSnapshot());
        }

        // Map items
        if (items != null && !items.isEmpty()) {
            dto.setItems(items.stream().map(it -> toBookingItemDetailsResponse(it, b)).collect(Collectors.toList()));
            BookingItem first = items.get(0);
            String firstServiceName = first.getServiceNameSnapshot() != null ? first.getServiceNameSnapshot()
                    : (first.getService() != null ? first.getService().getName() : null);
            dto.setServiceName(firstServiceName);
            dto.setServiceId(first.getService() != null ? first.getService().getId() : null);
        } else {
            dto.setItems(new ArrayList<>());
        }

        if (prods != null && !prods.isEmpty()) {
            dto.setProducts(prods.stream().map(bp -> BookingProductResponse.builder()
                    .id(bp.getId())
                    .productId(bp.getProduct() != null ? bp.getProduct().getId() : null)
                    .productName(bp.getProductNameSnapshot())
                    .brand(bp.getProduct() != null ? bp.getProduct().getBrand() : null)
                    .volumeOrSize(bp.getProduct() != null ? bp.getProduct().getVolumeOrSize() : null)
                    .image(bp.getProduct() != null ? bp.getProduct().getImage() : null)
                    .unitPrice(bp.getUnitPriceSnapshot())
                    .mrp(bp.getProduct() != null && bp.getProduct().getMrp() != null ? bp.getProduct().getMrp() : bp.getUnitPriceSnapshot())
                    .quantity(bp.getQuantity())
                    .totalPrice(bp.getTotalPrice())
                    .build()).collect(Collectors.toList()));
        } else {
            dto.setProducts(new ArrayList<>());
        }

        dto.setExpectedRewardPoints(resolvePoints(b, dto.getPricePaid(), ledgers));
        dto.setPointsConfirmed(b.getStatus() == BookingStatus.COMPLETED);
        dto.setTimeline(timeline != null ? timeline : new ArrayList<>());

        // Map Refund tracking
        String refStatus = b.getRefundStatus();
        if ((refStatus == null || refStatus.equalsIgnoreCase("NONE")) && b.getPayment() != null && b.getPayment().getRefundStatus() != null) {
            refStatus = b.getPayment().getRefundStatus();
        }
        dto.setRefundStatus(refStatus != null ? refStatus : "NONE");
        dto.setRefundAmount(b.getRefundAmount() != null ? b.getRefundAmount() : (b.getPayment() != null ? b.getPayment().getRefundedAmount() : null));
        dto.setRazorpayRefundId(b.getRazorpayRefundId() != null ? b.getRazorpayRefundId() : (b.getPayment() != null ? b.getPayment().getRazorpayRefundId() : null));
        dto.setRefundArn(b.getRefundArn() != null ? b.getRefundArn() : (b.getPayment() != null ? b.getPayment().getRefundArn() : null));
        dto.setRefundReason(b.getRefundReason() != null ? b.getRefundReason() : (b.getPayment() != null ? b.getPayment().getRefundReason() : null));
        dto.setRefundedAt(b.getRefundedAt() != null ? b.getRefundedAt() : (b.getPayment() != null ? b.getPayment().getRefundedAt() : null));
        dto.setRescheduleCount(b.getRescheduleCount() != null ? b.getRescheduleCount() : 0);

        return dto;
    }

    public BookingItemDetailsResponse toBookingItemDetailsResponse(BookingItem item) {
        return toBookingItemDetailsResponse(item, item != null ? item.getBooking() : null);
    }

    public BookingItemDetailsResponse toBookingItemDetailsResponse(BookingItem item, Booking parentBooking) {
        if (item == null) {
            return null;
        }
        BookingItemDetailsResponse dto = new BookingItemDetailsResponse();
        dto.setId(item.getId());
        dto.setServiceId(item.getService() != null ? item.getService().getId() : null);
        String sName = item.getServiceNameSnapshot() != null ? item.getServiceNameSnapshot()
                : (item.getService() != null ? item.getService().getName() : "Salon Service");
        dto.setServiceName(sName);

        Double itemPrice = item.getServicePriceSnapshot();
        if ((itemPrice == null || itemPrice == 0.0) && item.getService() != null && item.getService().getPrice() != null) {
            itemPrice = item.getService().getPrice();
        }
        dto.setPrice(itemPrice != null ? itemPrice : 0.0);

        Double subMrp = null;
        if (item.getService() != null && item.getService().getSubServices() != null) {
            for (SubService sub : item.getService().getSubServices()) {
                if (sub.getName() != null && sName.toLowerCase().contains(sub.getName().toLowerCase())) {
                    if (sub.getMrp() != null && sub.getMrp() > 0) {
                        subMrp = sub.getMrp();
                    }
                    break;
                }
            }
        }
        double uMrp = subMrp != null ? subMrp
                : (item.getService() != null && item.getService().getMrp() != null && item.getService().getMrp() > 0
                        ? item.getService().getMrp()
                        : dto.getPrice());
        if (uMrp < dto.getPrice()) {
            uMrp = dto.getPrice();
        }
        dto.setMrp(uMrp);

        dto.setDurationMinutes(item.getServiceDurationSnapshot() != null ? item.getServiceDurationSnapshot()
                : (item.getService() != null ? item.getService().getDurationMinutes() : 30));
        dto.setRewardCoins(item.getServiceRewardCoinsSnapshot() != null ? item.getServiceRewardCoinsSnapshot() : 0);
        dto.setImage(item.getService() != null ? item.getService().getImage() : null);

        boolean isCancelled = (parentBooking != null && parentBooking.getStatus() == BookingStatus.CANCELLED)
                || (item.getBooking() != null && item.getBooking().getStatus() == BookingStatus.CANCELLED)
                || item.getStatus() == BookingStatus.CANCELLED;

        if (isCancelled) {
            dto.setStatus("CANCELLED");
        } else {
            dto.setStatus(item.getStatus() != null ? item.getStatus().name() : "PENDING");
        }
        return dto;
    }

    private int resolvePoints(Booking b, Double pricePaid, List<PointsLedger> ledgers) {
        int resolvedPoints = 0;
        if (b.getStatus() == BookingStatus.COMPLETED && ledgers != null && !ledgers.isEmpty()) {
            resolvedPoints = ledgers.stream().mapToInt(l -> l.getChangeAmount() != null ? l.getChangeAmount() : 0).sum();
        }
        if (resolvedPoints <= 0 && b.getExpectedRewardPoints() != null && b.getExpectedRewardPoints() > 0) {
            resolvedPoints = b.getExpectedRewardPoints();
        }
        if (resolvedPoints <= 0) {
            double pAmount = pricePaid != null ? pricePaid : (b.getPricePaid() != null ? b.getPricePaid() : 0.0);
            double multiplier = 1.0;
            if (b.getUser() != null && b.getUser().getTier() != null) {
                switch (b.getUser().getTier()) {
                    case DIAMOND -> multiplier = 2.0;
                    case PLATINUM -> multiplier = 1.5;
                    case GOLD -> multiplier = 1.25;
                    case SILVER -> multiplier = 1.0;
                }
            }
            double spendPerCoin = 100.0;
            try {
                if (loyaltyConfigService != null) {
                    spendPerCoin = loyaltyConfigService.getOrCreateConfig().getSpendAmountPerCoin();
                    if (spendPerCoin <= 0) spendPerCoin = 100.0;
                }
            } catch (Exception ignored) {}

            int baseCoins = (int) Math.round((pAmount / spendPerCoin) * multiplier);
            int bonusCoins = 0;
            if (b.getBookingItems() != null) {
                bonusCoins = b.getBookingItems().stream()
                        .mapToInt(i -> i.getServiceRewardCoinsSnapshot() != null ? i.getServiceRewardCoinsSnapshot() : 0)
                        .sum();
            }
            resolvedPoints = Math.max(1, baseCoins + bonusCoins);
        }
        return resolvedPoints;
    }
}
