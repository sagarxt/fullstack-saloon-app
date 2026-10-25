package com.groomish_now.backend.service.cart.impl;

import com.groomish_now.backend.dto.booking.BookingResponse;
import com.groomish_now.backend.dto.cart.*;
import com.groomish_now.backend.dto.mail.BookingEmailDto;
import com.groomish_now.backend.enums.NotificationType;
import com.groomish_now.backend.enums.PaymentMethod;
import com.groomish_now.backend.enums.PaymentStatus;
import com.groomish_now.backend.mapper.BookingMapper;
import com.groomish_now.backend.model.*;
import com.groomish_now.backend.repository.*;
import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.enums.CartItemType;
import com.groomish_now.backend.enums.VoucherStatus;
import com.groomish_now.backend.service.store.BranchCatalogService;
import com.groomish_now.backend.service.booking.BookingTimelineService;
import com.groomish_now.backend.service.cart.CartService;
import com.groomish_now.backend.service.loyalty.LoyaltyConfigService;
import com.groomish_now.backend.service.utils.EmailService;
import com.groomish_now.backend.util.BookingCodeGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final CouponRepository couponRepository;
    private final RedeemedVoucherRepository redeemedVoucherRepository;
    private final BookingRepository bookingRepository;
    private final BookingItemRepository bookingItemRepository;
    private final BookingProductRepository bookingProductRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final BookingTimelineService bookingTimelineService;
    private final BranchCatalogService branchCatalogService;
    private final LoyaltyConfigService loyaltyConfigService;
    private final BookingMapper bookingMapper;

    public CartServiceImpl(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            UserRepository userRepository,
            ServiceRepository serviceRepository,
            ProductRepository productRepository,
            StoreRepository storeRepository,
            CouponRepository couponRepository,
            RedeemedVoucherRepository redeemedVoucherRepository,
            BookingRepository bookingRepository,
            BookingItemRepository bookingItemRepository,
            BookingProductRepository bookingProductRepository,
            PaymentRepository paymentRepository,
            NotificationRepository notificationRepository,
            EmailService emailService,
            BookingTimelineService bookingTimelineService,
            BranchCatalogService branchCatalogService,
            LoyaltyConfigService loyaltyConfigService,
            BookingMapper bookingMapper) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.serviceRepository = serviceRepository;
        this.productRepository = productRepository;
        this.storeRepository = storeRepository;
        this.couponRepository = couponRepository;
        this.redeemedVoucherRepository = redeemedVoucherRepository;
        this.bookingRepository = bookingRepository;
        this.bookingItemRepository = bookingItemRepository;
        this.bookingProductRepository = bookingProductRepository;
        this.paymentRepository = paymentRepository;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
        this.bookingTimelineService = bookingTimelineService;
        this.branchCatalogService = branchCatalogService;
        this.loyaltyConfigService = loyaltyConfigService;
        this.bookingMapper = bookingMapper;
    }

    /* =====================================================
       GET OR CREATE CART
       ===================================================== */
    @Override
    @Transactional
    public CartResponse getOrCreateCart(UUID userId) {
        Cart cart = getOrCreateCartEntity(userId);
        return mapToCartResponse(cart);
    }

    private Cart getOrCreateCartEntity(UUID userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            Store defaultStore = user.getStore();
            if (defaultStore == null) {
                defaultStore = storeRepository.findAllByActiveTrueOrderByCreatedAtAsc()
                        .stream().findFirst().orElse(null);
            }
            Cart newCart = Cart.builder()
                    .user(user)
                    .store(defaultStore)
                    .items(new ArrayList<>())
                    .build();
            return cartRepository.save(newCart);
        });
    }

    /* =====================================================
       ADD TO CART
       ===================================================== */
    @Override
    @Transactional
    public CartResponse addToCart(UUID userId, AddToCartRequest request) {
        Cart cart = getOrCreateCartEntity(userId);

        if (request.getStoreId() != null) {
            storeRepository.findById(request.getStoreId()).ifPresent(cart::setStore);
        }

        int qtyToAdd = (request.getQuantity() != null && request.getQuantity() > 0) ? request.getQuantity() : 1;

        if (request.getItemType() == CartItemType.SERVICE) {
            if (request.getServiceId() == null) {
                throw new RuntimeException("Service ID is required for service cart item");
            }
            ServiceEntity service = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new RuntimeException("Service not found with id: " + request.getServiceId()));

            String subName = request.getSubServiceName() != null && !request.getSubServiceName().isBlank()
                    ? request.getSubServiceName().trim()
                    : null;
            Double subPrice = request.getSubServicePrice();
            Integer subDur = request.getSubServiceDuration();

            if (subName != null && subPrice == null && service.getSubServices() != null) {
                for (SubService sub : service.getSubServices()) {
                    if (sub.getName().equalsIgnoreCase(subName)) {
                        subPrice = sub.getPrice();
                        subDur = sub.getDurationMinutes();
                        break;
                    }
                }
            }

            // Find existing matching service and matching subService
            List<CartItem> cartItems = cartItemRepository.findByCartIdOrderByCreatedAtAsc(cart.getId());
            Optional<CartItem> existing = cartItems.stream()
                    .filter(ci -> ci.getItemType() == CartItemType.SERVICE
                            && ci.getService() != null
                            && ci.getService().getId().equals(service.getId())
                            && java.util.Objects.equals(ci.getSubServiceName(), subName))
                    .findFirst();

            if (existing.isPresent()) {
                CartItem item = existing.get();
                item.setQuantity(item.getQuantity() + qtyToAdd);
                if (request.getCustomNotes() != null) {
                    item.setCustomNotes(request.getCustomNotes());
                }
                if (subPrice != null) item.setSubServicePrice(subPrice);
                if (subDur != null) item.setSubServiceDuration(subDur);
                cartItemRepository.save(item);
            } else {
                CartItem item = CartItem.builder()
                        .cart(cart)
                        .itemType(CartItemType.SERVICE)
                        .service(service)
                        .subServiceName(subName)
                        .subServicePrice(subPrice)
                        .subServiceDuration(subDur)
                        .quantity(qtyToAdd)
                        .customNotes(request.getCustomNotes())
                        .build();
                cartItemRepository.save(item);
            }
        } else if (request.getItemType() == CartItemType.PRODUCT) {
            if (request.getProductId() == null) {
                throw new RuntimeException("Product ID is required for product cart item");
            }
            Product product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));

            Optional<CartItem> existing = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
            if (existing.isPresent()) {
                CartItem item = existing.get();
                item.setQuantity(item.getQuantity() + qtyToAdd);
                if (request.getCustomNotes() != null) {
                    item.setCustomNotes(request.getCustomNotes());
                }
                cartItemRepository.save(item);
            } else {
                CartItem item = CartItem.builder()
                        .cart(cart)
                        .itemType(CartItemType.PRODUCT)
                        .product(product)
                        .quantity(qtyToAdd)
                        .customNotes(request.getCustomNotes())
                        .build();
                cartItemRepository.save(item);
            }
        } else {
            throw new RuntimeException("Invalid item type: " + request.getItemType());
        }

        cartRepository.save(cart);
        // Refresh items
        return mapToCartResponse(getOrCreateCartEntity(userId));
    }

    /* =====================================================
       UPDATE CART ITEM
       ===================================================== */
    @Override
    @Transactional
    public CartResponse updateCartItem(UUID userId, UUID itemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCartEntity(userId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Item does not belong to user's cart");
        }

        if (request.getQuantity() != null) {
            if (request.getQuantity() <= 0) {
                cartItemRepository.delete(item);
            } else {
                item.setQuantity(request.getQuantity());
                if (request.getCustomNotes() != null) {
                    item.setCustomNotes(request.getCustomNotes());
                }
                cartItemRepository.save(item);
            }
        } else if (request.getCustomNotes() != null) {
            item.setCustomNotes(request.getCustomNotes());
            cartItemRepository.save(item);
        }

        return mapToCartResponse(getOrCreateCartEntity(userId));
    }

    /* =====================================================
       REMOVE CART ITEM
       ===================================================== */
    @Override
    @Transactional
    public CartResponse removeCartItem(UUID userId, UUID itemId) {
        Cart cart = getOrCreateCartEntity(userId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Item does not belong to user's cart");
        }

        cartItemRepository.delete(item);
        return mapToCartResponse(getOrCreateCartEntity(userId));
    }

    /* =====================================================
       CLEAR CART
       ===================================================== */
    @Override
    @Transactional
    public CartResponse clearCart(UUID userId) {
        Cart cart = getOrCreateCartEntity(userId);
        cartItemRepository.deleteByCartId(cart.getId());
        return mapToCartResponse(getOrCreateCartEntity(userId));
    }

    /* =====================================================
       SET STORE
       ===================================================== */
    @Override
    @Transactional
    public CartResponse setStore(UUID userId, UUID storeId) {
        Cart cart = getOrCreateCartEntity(userId);
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found with id: " + storeId));
        cart.setStore(store);
        cartRepository.save(cart);
        return mapToCartResponse(cart);
    }

    /* =====================================================
       STAFF & ADMIN MANAGEMENT FOR INDIVIDUAL USER
       ===================================================== */
    @Override
    @Transactional
    public CartResponse getCartForUser(UUID userId) {
        return getOrCreateCart(userId);
    }

    @Override
    @Transactional
    public CartResponse addItemForUser(UUID userId, AddToCartRequest request) {
        return addToCart(userId, request);
    }

    @Override
    @Transactional
    public CartResponse updateItemForUser(UUID userId, UUID itemId, UpdateCartItemRequest request) {
        return updateCartItem(userId, itemId, request);
    }

    @Override
    @Transactional
    public CartResponse removeItemForUser(UUID userId, UUID itemId) {
        return removeCartItem(userId, itemId);
    }

    @Override
    @Transactional
    public CartResponse clearCartForUser(UUID userId) {
        return clearCart(userId);
    }

    /* =====================================================
       CHECKOUT CART
       ===================================================== */
    @Override
    @Transactional
    public BookingResponse checkoutCart(UUID userId, CartCheckoutRequest request) {
        Cart cart = getOrCreateCartEntity(userId);
        List<CartItem> items = cartItemRepository.findByCartIdOrderByCreatedAtAsc(cart.getId());

        if (items.isEmpty()) {
            throw new RuntimeException("Your cart is empty. Add services or products before checkout.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Determine Store
        Store store = null;
        if (request.getStoreId() != null) {
            store = storeRepository.findById(request.getStoreId()).orElse(null);
        }
        if (store == null && cart.getStore() != null) {
            store = cart.getStore();
        }
        if (store == null) {
            store = storeRepository.findAllByActiveTrueOrderByCreatedAtAsc().stream().findFirst().orElse(null);
        }

        // Separate services and products
        List<CartItem> serviceItems = items.stream()
                .filter(i -> i.getItemType() == CartItemType.SERVICE && i.getService() != null)
                .collect(Collectors.toList());

        List<CartItem> productItems = items.stream()
                .filter(i -> i.getItemType() == CartItemType.PRODUCT && i.getProduct() != null)
                .collect(Collectors.toList());

        // Validate scheduling if services exist or if scheduledAt provided
        LocalDateTime scheduledAt = request.getScheduledAt();
        if (!serviceItems.isEmpty()) {
            if (scheduledAt == null) {
                throw new RuntimeException("Appointment date & time is required for salon service treatments.");
            }
            if (scheduledAt.isBefore(LocalDateTime.now().minusMinutes(15))) {
                throw new RuntimeException("Selected appointment slot cannot be in the past. Please select an upcoming slot.");
            }
        } else {
            if (scheduledAt == null || scheduledAt.isBefore(LocalDateTime.now().minusMinutes(15))) {
                scheduledAt = LocalDateTime.now();
            }
        }

        // Validate service branch catalog availability
        if (store != null) {
            for (CartItem ci : serviceItems) {
                ServiceEntity s = ci.getService();
                if (!branchCatalogService.isServiceAvailableAtStore(store.getId(), s.getId())) {
                    throw new RuntimeException("Service '" + s.getName() + "' is currently disabled or unavailable at " + store.getName() + ".");
                }
            }
        }

        // Calculate Totals & Duration
        double servicesTotal = 0.0;
        int totalDuration = 0;
        for (CartItem ci : serviceItems) {
            int qty = ci.getQuantity() != null && ci.getQuantity() > 0 ? ci.getQuantity() : 1;
            double unitPrice = ci.getSubServicePrice() != null ? ci.getSubServicePrice() : (ci.getService() != null && ci.getService().getPrice() != null ? ci.getService().getPrice() : 0.0);
            servicesTotal += unitPrice * qty;
            int dur = ci.getSubServiceDuration() != null ? ci.getSubServiceDuration() : (ci.getService() != null && ci.getService().getDurationMinutes() != null ? ci.getService().getDurationMinutes() : 30);
            totalDuration += dur * qty;
        }

        double productsTotal = 0.0;
        for (CartItem ci : productItems) {
            int qty = ci.getQuantity() != null && ci.getQuantity() > 0 ? ci.getQuantity() : 1;
            double unitPrice = ci.getProduct() != null && ci.getProduct().getPrice() != null ? ci.getProduct().getPrice() : 0.0;
            productsTotal += unitPrice * qty;
        }

        double grossTotal = servicesTotal + productsTotal;

        // Check 5-Stylist capacity if appointment slot scheduled
        if (scheduledAt != null && !serviceItems.isEmpty()) {
            LocalDateTime reqStart = scheduledAt;
            LocalDateTime reqEnd = reqStart.plusMinutes(totalDuration > 0 ? totalDuration : 30);
            List<Booking> dayBookings = bookingRepository.findBookingsForDate(reqStart.toLocalDate());
            int overlapCount = 0;
            for (Booking b : dayBookings) {
                if (b.getStatus() == BookingStatus.CANCELLED) continue;
                LocalDateTime bStart = b.getScheduledAt();
                if (bStart == null) continue;
                int bDur = b.getTotalDurationMinutes() != null && b.getTotalDurationMinutes() > 0 ? b.getTotalDurationMinutes() : 30;
                LocalDateTime bEnd = bStart.plusMinutes(bDur);
                if (bStart.isBefore(reqEnd) && bEnd.isAfter(reqStart)) {
                    overlapCount++;
                }
            }
            if (overlapCount >= 5) {
                throw new RuntimeException("Selected time slot is fully booked across all 5 salon stylists. Please choose another slot.");
            }
        }

        // Apply Coupon or Voucher
        Coupon coupon = null;
        double discount = 0.0;

        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon c = couponRepository.findByCodeAndActiveTrue(request.getCouponCode().trim())
                    .orElseThrow(() -> new RuntimeException("Invalid coupon code: " + request.getCouponCode()));

            if (!c.isActive() || (c.getExpiryDate() != null && c.getExpiryDate().isBefore(LocalDateTime.now()))) {
                throw new RuntimeException("Coupon '" + c.getCode() + "' has expired or is inactive.");
            }
            if (c.getStartDate() != null && c.getStartDate().isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Coupon '" + c.getCode() + "' is not active yet (valid from " + c.getStartDate().toLocalDate() + ").");
            }
            if (c.getApplicableUserGroups() != null && !c.getApplicableUserGroups().isEmpty() && !c.getApplicableUserGroups().contains("ALL")) {
                java.util.Set<String> effectiveGroups = user.getAllEffectiveGroups();
                boolean matches = c.getApplicableUserGroups().stream()
                        .anyMatch(grp -> grp.equalsIgnoreCase("ALL") || effectiveGroups.contains(grp.toUpperCase().trim()));
                if (!matches) {
                    throw new RuntimeException("Coupon '" + c.getCode() + "' is exclusively reserved for members of: " + String.join(", ", c.getApplicableUserGroups()));
                }
            }

            final java.util.List<String> eligibleCats = c.getEligibleCategories();
            boolean hasSpecificCategories = eligibleCats != null && !eligibleCats.isEmpty()
                    && eligibleCats.stream().noneMatch(ec -> ec.trim().equalsIgnoreCase("ALL"));

            if (hasSpecificCategories) {
                double eligibleCategoryTotal = 0.0;
                int eligibleItemCount = 0;

                for (CartItem ci : cart.getItems()) {
                    int qty = ci.getQuantity() != null && ci.getQuantity() > 0 ? ci.getQuantity() : 1;
                    boolean matchesCategory = false;

                    if (ci.getService() != null && ci.getService().getCategory() != null) {
                        String catName = ci.getService().getCategory().getName();
                        String catId = ci.getService().getCategory().getId() != null ? ci.getService().getCategory().getId().toString() : "";
                        matchesCategory = eligibleCats.stream().anyMatch(ec -> {
                            String cleanEc = ec.trim();
                            return (catName != null && cleanEc.equalsIgnoreCase(catName))
                                    || cleanEc.equalsIgnoreCase(catId)
                                    || (catName != null && (catName.toLowerCase().contains(cleanEc.toLowerCase()) || cleanEc.toLowerCase().contains(catName.toLowerCase())));
                        });
                    } else if (ci.getProduct() != null && ci.getProduct().getCategory() != null) {
                        String prodCat = ci.getProduct().getCategory();
                        matchesCategory = eligibleCats.stream().anyMatch(ec -> {
                            String cleanEc = ec.trim();
                            return cleanEc.equalsIgnoreCase(prodCat)
                                    || prodCat.toLowerCase().contains(cleanEc.toLowerCase())
                                    || cleanEc.toLowerCase().contains(prodCat.toLowerCase());
                        });
                    }

                    if (matchesCategory) {
                        eligibleItemCount += qty;
                        double itemPrice = 0.0;
                        if (ci.getItemType() == CartItemType.SERVICE && ci.getService() != null) {
                            itemPrice = ci.getSubServicePrice() != null ? ci.getSubServicePrice() : (ci.getService().getPrice() != null ? ci.getService().getPrice() : 0.0);
                        } else if (ci.getItemType() == CartItemType.PRODUCT && ci.getProduct() != null) {
                            itemPrice = ci.getProduct().getPrice() != null ? ci.getProduct().getPrice() : 0.0;
                        }
                        eligibleCategoryTotal += itemPrice * qty;
                    }
                }

                if (eligibleItemCount == 0) {
                    throw new RuntimeException("Coupon '" + c.getCode() + "' is only valid for categories: " + String.join(", ", eligibleCats));
                }

                if (c.getMinAmount() != null && eligibleCategoryTotal < c.getMinAmount()) {
                    throw new RuntimeException("Combined total for eligible categories (" + String.join(", ", eligibleCats) + ") is ₹" + eligibleCategoryTotal + ", which does not meet coupon minimum of ₹" + c.getMinAmount());
                }

                coupon = c;
                discount = c.getDiscount() != null ? c.getDiscount() : 0.0;
                if (c.getMaxDiscount() != null && discount > c.getMaxDiscount()) {
                    discount = c.getMaxDiscount();
                }
                if (discount > eligibleCategoryTotal) {
                    discount = eligibleCategoryTotal;
                }
            } else {
                if (c.getMinAmount() != null && grossTotal < c.getMinAmount()) {
                    throw new RuntimeException("Order total ₹" + grossTotal + " does not meet coupon minimum of ₹" + c.getMinAmount());
                }

                coupon = c;
                discount = c.getDiscount() != null ? c.getDiscount() : 0.0;
                if (c.getMaxDiscount() != null && discount > c.getMaxDiscount()) {
                    discount = c.getMaxDiscount();
                }
                if (discount > grossTotal) {
                    discount = grossTotal;
                }
            }
        } else if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            RedeemedVoucher voucher = redeemedVoucherRepository.findByVoucherCode(request.getVoucherCode().trim())
                    .orElseThrow(() -> new RuntimeException("Invalid voucher code: " + request.getVoucherCode()));

            if (!voucher.getUser().getId().equals(userId)) {
                throw new RuntimeException("Voucher does not belong to your account.");
            }
            if (voucher.getStatus() != VoucherStatus.ACTIVE) {
                throw new RuntimeException("Voucher code '" + voucher.getVoucherCode() + "' is already " + voucher.getStatus() + ".");
            }
            if (voucher.getExpiresAt() != null && voucher.getExpiresAt().isBefore(LocalDateTime.now())) {
                voucher.setStatus(VoucherStatus.EXPIRED);
                redeemedVoucherRepository.save(voucher);
                throw new RuntimeException("Voucher has expired.");
            }

            if (voucher.getDiscountPercent() != null && voucher.getDiscountPercent() > 0) {
                if (voucher.getServiceId() != null) {
                    // Check if voucher's service is in the cart
                    Optional<CartItem> matchingSrv = serviceItems.stream()
                            .filter(si -> si.getService().getId().equals(voucher.getServiceId()))
                            .findFirst();
                    if (matchingSrv.isPresent()) {
                        double srvPrice = matchingSrv.get().getService().getPrice();
                        discount = (srvPrice * voucher.getDiscountPercent()) / 100.0;
                    } else {
                        // Discount on grossTotal
                        discount = (grossTotal * voucher.getDiscountPercent()) / 100.0;
                    }
                } else {
                    discount = (grossTotal * voucher.getDiscountPercent()) / 100.0;
                }
            }

            // Mark voucher as APPLIED
            voucher.setStatus(VoucherStatus.APPLIED);
            redeemedVoucherRepository.save(voucher);
        }

        double finalPrice = Math.max(grossTotal - discount, 0.0);

        // Payment Mode
        PaymentMethod method = PaymentMethod.CASH;
        PaymentStatus paymentStatus = PaymentStatus.PENDING;

        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            String pm = request.getPaymentMethod().toUpperCase();
            if (pm.contains("ONLINE") || pm.contains("RAZORPAY")) {
                method = PaymentMethod.ONLINE;
                paymentStatus = PaymentStatus.PENDING;
            } else if (pm.contains("UPI")) {
                method = PaymentMethod.UPI;
                paymentStatus = PaymentStatus.PENDING;
            } else if (pm.contains("CARD")) {
                method = PaymentMethod.CARD;
                paymentStatus = PaymentStatus.PENDING;
            }
        }

        // Pay at Salon (CASH) or completed payment -> CONFIRMED. Online payment pending -> PENDING.
        BookingStatus initialStatus = (method == PaymentMethod.CASH || paymentStatus == PaymentStatus.COMPLETED)
                ? BookingStatus.CONFIRMED
                : BookingStatus.PENDING;

        Payment payment = Payment.builder()
                .user(user)
                .amount(finalPrice)
                .paymentMethod(method)
                .paymentModeDetails(method == PaymentMethod.CASH ? "Pay at Salon" : "Online Payment (Razorpay)")
                .status(paymentStatus)
                .invoiceNumber("INV-CART-" + (System.currentTimeMillis() % 1000000))
                .paymentGatewayId("PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();
        paymentRepository.save(payment);

        // Create Booking
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setStore(store);
        if (store != null) {
            booking.setStoreNameSnapshot(store.getName());
            booking.setStoreAddressSnapshot(store.getAddress() + ", " + store.getCity());
        }
        booking.setBookingCode(BookingCodeGenerator.generateUniqueCode(bookingRepository));
        booking.setScheduledAt(scheduledAt != null ? scheduledAt : LocalDateTime.now());
        booking.setNote(request.getNote());
        booking.setCoupon(coupon);
        booking.setTotalAmount(grossTotal);
        booking.setPricePaid(finalPrice);
        booking.setStatus(initialStatus);
        booking.setBookedBy("SELF_CART_CHECKOUT");
        booking.setTotalDurationMinutes(totalDuration);
        booking.setPayment(payment);

        Booking savedBooking = bookingRepository.save(booking);

        // Save BookingItems for Services
        List<BookingItem> savedBookingItems = new ArrayList<>();
        for (CartItem ci : serviceItems) {
            ServiceEntity s = ci.getService();
            int qty = ci.getQuantity() != null && ci.getQuantity() > 0 ? ci.getQuantity() : 1;
            String itemName = s.getName();
            if (ci.getSubServiceName() != null && !ci.getSubServiceName().isBlank()) {
                itemName = s.getName() + " (" + ci.getSubServiceName() + ")";
            }
            double itemPrice = ci.getSubServicePrice() != null ? ci.getSubServicePrice() : (s.getPrice() != null ? s.getPrice() : 0.0);
            int itemDur = ci.getSubServiceDuration() != null ? ci.getSubServiceDuration() : (s.getDurationMinutes() != null ? s.getDurationMinutes() : 30);

            for (int q = 0; q < qty; q++) {
                BookingItem bi = new BookingItem();
                bi.setBooking(savedBooking);
                bi.setService(s);
                bi.setServiceNameSnapshot(itemName);
                bi.setServicePriceSnapshot(itemPrice);
                bi.setServiceDurationSnapshot(itemDur);
                bi.setServiceRewardCoinsSnapshot(s.getRewards() != null ? s.getRewards() : 0);
                bi.setStatus(initialStatus);
                savedBookingItems.add(bookingItemRepository.save(bi));
            }
        }
        savedBooking.setBookingItems(savedBookingItems);

        // Save BookingProducts for Products
        List<BookingProduct> savedBookingProducts = new ArrayList<>();
        for (CartItem ci : productItems) {
            Product p = ci.getProduct();
            int qty = ci.getQuantity() != null && ci.getQuantity() > 0 ? ci.getQuantity() : 1;
            double pTotal = p.getPrice() * qty;

            // Decrement product stock if managed
            if (p.getStockQuantity() != null && p.getStockQuantity() >= qty) {
                p.setStockQuantity(p.getStockQuantity() - qty);
                productRepository.save(p);
            }

            BookingProduct bp = BookingProduct.builder()
                    .booking(savedBooking)
                    .product(p)
                    .productNameSnapshot(p.getName())
                    .unitPriceSnapshot(p.getPrice())
                    .quantity(qty)
                    .totalPrice(pTotal)
                    .build();
            savedBookingProducts.add(bookingProductRepository.save(bp));
        }
        savedBooking.setBookingProducts(savedBookingProducts);

        // Snapshot expected reward points at booking creation time (immutable on future service catalog changes)
        double multiplier = 1.0;
        if (user.getTier() != null) {
            switch (user.getTier()) {
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

        int baseCoins = (int) Math.round((finalPrice / spendPerCoin) * multiplier);
        int bonusCoins = savedBookingItems.stream()
                .mapToInt(i -> i.getServiceRewardCoinsSnapshot() != null ? i.getServiceRewardCoinsSnapshot() : 0)
                .sum();
        int expectedRewardPoints = Math.max(1, baseCoins + bonusCoins);
        savedBooking.setExpectedRewardPoints(expectedRewardPoints);
        savedBooking = bookingRepository.save(savedBooking);

        // Record Timeline
        int totalItemsCount = serviceItems.size() + productItems.size();
        bookingTimelineService.recordTimeline(
                savedBooking,
                "CREATED",
                "Order & Booking Checked Out from Cart",
                "Order placed by " + user.getName() + " with " + serviceItems.size() + " service(s) and " + productItems.size() + " product(s). Total: ₹" + finalPrice,
                user.getName(),
                "CUSTOMER",
                user.getEmail()
        );

        // In-app Notification
        String serviceNames = serviceItems.stream().map(si -> si.getService().getName()).collect(Collectors.joining(", "));
        if (serviceNames.isBlank()) {
            serviceNames = productItems.stream().map(pi -> pi.getProduct().getName()).collect(Collectors.joining(", "));
        }

        // Only emit notification & email if booking is confirmed immediately (e.g. Pay at Salon / CASH).
        // For ONLINE payment (PENDING), the final confirmation is sent after payment verification so the customer isn't spammed.
        if (initialStatus == BookingStatus.CONFIRMED) {
            String detailsSummary = (serviceItems.size() > 0 ? serviceItems.size() + " service(s)" : "")
                    + (serviceItems.size() > 0 && productItems.size() > 0 ? " & " : "")
                    + (productItems.size() > 0 ? productItems.size() + " retail product(s)" : "");

            Notification notification = Notification.builder()
                    .user(user)
                    .title("Order & Booking Confirmed")
                    .message("Your order (" + detailsSummary + ") is confirmed! Booking ID: " + savedBooking.getBookingCode())
                    .type(NotificationType.BOOKING)
                    .referenceId(savedBooking.getId())
                    .link("/customer/bookings/" + savedBooking.getId())
                    .build();
            notificationRepository.save(notification);

            BookingEmailDto emailDto = BookingEmailDto.fromBooking(savedBooking);
            emailService.sendBookingConfirmationEmail(emailDto);
        }

        // CLEAR DB CART
        cartItemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();
        cartRepository.save(cart);

        // Build BookingResponse
        return toBookingResponse(savedBooking, serviceNames);
    }

    /* =====================================================
       HELPERS / MAPPERS
       ===================================================== */
    private CartResponse mapToCartResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartIdOrderByCreatedAtAsc(cart.getId());

        List<CartItemResponse> itemResponses = new ArrayList<>();
        double servicesSubtotal = 0.0;
        double productsSubtotal = 0.0;
        int servicesCount = 0;
        int productsCount = 0;
        int totalDuration = 0;
        int totalItemCount = 0;

        for (CartItem item : items) {
            int qty = item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1;
            totalItemCount += qty;

            CartItemResponse.CartItemResponseBuilder builder = CartItemResponse.builder()
                    .id(item.getId())
                    .itemType(item.getItemType().name())
                    .quantity(qty)
                    .customNotes(item.getCustomNotes());

            if (item.getItemType() == CartItemType.SERVICE && item.getService() != null) {
                ServiceEntity s = item.getService();
                servicesCount += qty;
                double unitPrice = item.getSubServicePrice() != null ? item.getSubServicePrice() : (s.getPrice() != null ? s.getPrice() : 0.0);
                double itemTotal = unitPrice * qty;
                servicesSubtotal += itemTotal;
                int dur = item.getSubServiceDuration() != null ? item.getSubServiceDuration() : (s.getDurationMinutes() != null ? s.getDurationMinutes() : 0);
                totalDuration += dur * qty;

                String sName = (item.getSubServiceName() != null && !item.getSubServiceName().isBlank())
                        ? s.getName() + " (" + item.getSubServiceName() + ")"
                        : s.getName();

                Double subMrp = null;
                if (item.getSubServiceName() != null && s.getSubServices() != null) {
                    for (SubService sub : s.getSubServices()) {
                        if (item.getSubServiceName().equalsIgnoreCase(sub.getName())) {
                            if (sub.getMrp() != null && sub.getMrp() > 0) {
                                subMrp = sub.getMrp();
                            }
                            break;
                        }
                    }
                }
                Double effectiveMrp = subMrp != null ? subMrp : (s.getMrp() != null ? s.getMrp() : unitPrice);
                if (effectiveMrp < unitPrice) {
                    effectiveMrp = unitPrice;
                }

                builder.serviceId(s.getId())
                        .serviceName(sName)
                        .subServiceName(item.getSubServiceName())
                        .subServicePrice(item.getSubServicePrice())
                        .subServiceDuration(item.getSubServiceDuration())
                        .subServiceMrp(subMrp)
                        .servicePrice(unitPrice)
                        .serviceMrp(effectiveMrp)
                        .mrp(effectiveMrp)
                        .serviceDurationMinutes(dur)
                        .serviceGender(s.getGender() != null ? s.getGender().name() : null)
                        .serviceCategoryName(s.getCategory() != null ? s.getCategory().getName() : null)
                        .serviceImage(s.getImage())
                        .unitPrice(unitPrice)
                        .totalPrice(itemTotal);
            } else if (item.getItemType() == CartItemType.PRODUCT && item.getProduct() != null) {
                Product p = item.getProduct();
                productsCount += qty;
                double unitPrice = p.getPrice() != null ? p.getPrice() : 0.0;
                double itemTotal = unitPrice * qty;
                productsSubtotal += itemTotal;
                Double pMrp = p.getMrp() != null && p.getMrp() >= unitPrice ? p.getMrp() : unitPrice;

                builder.productId(p.getId())
                        .productName(p.getName())
                        .productBrand(p.getBrand())
                        .productPrice(unitPrice)
                        .productMrp(pMrp)
                        .mrp(pMrp)
                        .productImage(p.getImage())
                        .productVolume(p.getVolumeOrSize())
                        .productCategory(p.getCategory())
                        .unitPrice(unitPrice)
                        .totalPrice(itemTotal);
            }

            itemResponses.add(builder.build());
        }

        double totalAmount = servicesSubtotal + productsSubtotal;
        int estimatedPoints = (int) Math.round(totalAmount / 100.0);

        Store store = cart.getStore();

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUser() != null ? cart.getUser().getId() : null)
                .userName(cart.getUser() != null ? cart.getUser().getName() : null)
                .userEmail(cart.getUser() != null ? cart.getUser().getEmail() : null)
                .storeId(store != null ? store.getId() : null)
                .storeName(store != null ? store.getName() : null)
                .storeAddress(store != null ? (store.getAddress() + ", " + store.getCity()) : null)
                .items(itemResponses)
                .totalItemCount(totalItemCount)
                .servicesCount(servicesCount)
                .productsCount(productsCount)
                .servicesSubtotal(servicesSubtotal)
                .productsSubtotal(productsSubtotal)
                .totalAmount(totalAmount)
                .totalDurationMinutes(totalDuration)
                .estimatedLoyaltyPoints(estimatedPoints)
                .build();
    }

    private BookingResponse toBookingResponse(Booking b, String serviceNames) {
        BookingResponse dto = bookingMapper.toBookingResponse(b);
        if (serviceNames != null && !serviceNames.isBlank() && (dto.getServiceName() == null || dto.getServiceName().isBlank())) {
            dto.setServiceName(serviceNames);
        }
        return dto;
    }
}
