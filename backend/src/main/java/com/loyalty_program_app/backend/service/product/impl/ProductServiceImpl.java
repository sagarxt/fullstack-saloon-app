package com.loyalty_program_app.backend.service.product.impl;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.mail.BillItemDto;
import com.loyalty_program_app.backend.dto.product.AddProductToBookingRequest;
import com.loyalty_program_app.backend.dto.product.BookingProductResponse;
import com.loyalty_program_app.backend.dto.product.ProductRequest;
import com.loyalty_program_app.backend.dto.product.ProductResponse;
import com.loyalty_program_app.backend.enums.BookingStatus;
import com.loyalty_program_app.backend.enums.NotificationType;
import com.loyalty_program_app.backend.enums.PointReason;
import com.loyalty_program_app.backend.enums.Tier;
import com.loyalty_program_app.backend.model.*;
import com.loyalty_program_app.backend.repository.*;
import com.loyalty_program_app.backend.service.product.ProductService;
import com.loyalty_program_app.backend.service.utils.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final BookingRepository bookingRepository;
    private final BookingProductRepository bookingProductRepository;
    private final UserRepository userRepository;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final com.loyalty_program_app.backend.service.utils.CloudinaryService cloudinaryService;

    @Override
    public List<ProductResponse> getAllActiveProducts() {
        return productRepository.findByActiveTrue().stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable)
                .map(this::toProductResponse);
    }

    @Override
    public ProductResponse getProductById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return toProductResponse(product);
    }

    @Override
    public List<ProductResponse> getProductsByCategory(String category) {
        return productRepository.findByCategoryIgnoreCaseAndActiveTrue(category).stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> searchProducts(String query) {
        if (query == null || query.isBlank()) {
            return getAllActiveProducts();
        }
        return productRepository.searchActiveProducts(query.trim()).stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getProductCategories() {
        return productRepository.findDistinctCategories();
    }

    @Override
    public ProductResponse createProduct(ProductRequest request) {
        String finalImageUrl = request.getImage();
        if (finalImageUrl != null && !finalImageUrl.isBlank() && !finalImageUrl.contains("cloudinary.com")) {
            finalImageUrl = cloudinaryService.upload(finalImageUrl.trim(), "groomishnow/product");
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .brand(request.getBrand())
                .category(request.getCategory())
                .price(request.getPrice())
                .mrp(request.getMrp() != null ? request.getMrp() : request.getPrice())
                .volumeOrSize(request.getVolumeOrSize())
                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 50)
                .image(finalImageUrl)
                .inStorePickupOnly(request.getInStorePickupOnly() != null ? request.getInStorePickupOnly() : true)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Product saved = productRepository.save(product);
        return toProductResponse(saved);
    }

    @Override
    public ProductResponse updateProduct(UUID id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        if (request.getName() != null) product.setName(request.getName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getBrand() != null) product.setBrand(request.getBrand());
        if (request.getCategory() != null) product.setCategory(request.getCategory());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getMrp() != null) product.setMrp(request.getMrp());
        if (request.getVolumeOrSize() != null) product.setVolumeOrSize(request.getVolumeOrSize());
        if (request.getStockQuantity() != null) product.setStockQuantity(request.getStockQuantity());
        if (request.getImage() != null) {
            String updatedImage = request.getImage();
            if (!updatedImage.isBlank() && !updatedImage.contains("cloudinary.com")) {
                updatedImage = cloudinaryService.upload(updatedImage.trim(), "groomishnow/product");
            }
            product.setImage(updatedImage);
        }
        if (request.getInStorePickupOnly() != null) product.setInStorePickupOnly(request.getInStorePickupOnly());
        if (request.getActive() != null) product.setActive(request.getActive());

        Product saved = productRepository.save(product);
        return toProductResponse(saved);
    }

    @Override
    public void deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        product.setActive(false);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public BookingResponse addProductToBooking(UUID bookingId, AddProductToBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot add products to a cancelled booking");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));

        int qty = request.getQuantity() != null && request.getQuantity() > 0 ? request.getQuantity() : 1;
        double itemTotal = product.getPrice() * qty;

        // Decrement product stock if available
        if (product.getStockQuantity() != null && product.getStockQuantity() >= qty) {
            product.setStockQuantity(product.getStockQuantity() - qty);
            productRepository.save(product);
        }

        BookingProduct bp = BookingProduct.builder()
                .booking(booking)
                .product(product)
                .productNameSnapshot(product.getName())
                .unitPriceSnapshot(product.getPrice())
                .quantity(qty)
                .totalPrice(itemTotal)
                .build();

        bookingProductRepository.save(bp);

        // Update booking totals
        double currentTotal = booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0;
        double currentPaid = booking.getPricePaid() != null ? booking.getPricePaid() : 0.0;
        booking.setTotalAmount(currentTotal + itemTotal);
        booking.setPricePaid(currentPaid + itemTotal);

        Booking savedBooking = bookingRepository.save(booking);
        return toBookingResponse(savedBooking);
    }

    @Override
    @Transactional
    public BookingResponse removeProductFromBooking(UUID bookingId, UUID bookingProductId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));

        BookingProduct bp = bookingProductRepository.findById(bookingProductId)
                .orElseThrow(() -> new RuntimeException("BookingProduct not found with id: " + bookingProductId));

        // Restore stock
        if (bp.getProduct() != null && bp.getProduct().getStockQuantity() != null) {
            Product prod = bp.getProduct();
            prod.setStockQuantity(prod.getStockQuantity() + bp.getQuantity());
            productRepository.save(prod);
        }

        double diff = bp.getTotalPrice() != null ? bp.getTotalPrice() : 0.0;
        double currentTotal = booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0;
        double currentPaid = booking.getPricePaid() != null ? booking.getPricePaid() : 0.0;

        booking.setTotalAmount(Math.max(0, currentTotal - diff));
        booking.setPricePaid(Math.max(0, currentPaid - diff));

        bookingProductRepository.delete(bp);
        Booking saved = bookingRepository.save(booking);
        return toBookingResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse completeBookingAndSendBill(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot complete a cancelled booking");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCompletedAt(LocalDateTime.now());

        // Prepare line items for bill email
        List<BillItemDto> billItems = new ArrayList<>();

        if (booking.getBookingItems() != null) {
            for (BookingItem item : booking.getBookingItems()) {
                billItems.add(BillItemDto.builder()
                        .name(item.getServiceNameSnapshot() != null ? item.getServiceNameSnapshot() : "Salon Service")
                        .type("SERVICE")
                        .quantity(1)
                        .unitPrice(item.getServicePriceSnapshot())
                        .totalPrice(item.getServicePriceSnapshot())
                        .build());
            }
        }

        List<BookingProduct> attachedProducts = bookingProductRepository.findByBookingId(bookingId);
        if (attachedProducts != null) {
            for (BookingProduct bp : attachedProducts) {
                billItems.add(BillItemDto.builder()
                        .name(bp.getProductNameSnapshot() != null ? bp.getProductNameSnapshot() : "Store Product")
                        .type("PRODUCT")
                        .quantity(bp.getQuantity())
                        .unitPrice(bp.getUnitPriceSnapshot())
                        .totalPrice(bp.getTotalPrice())
                        .build());
            }
        }

        double finalAmount = booking.getPricePaid() != null ? booking.getPricePaid() : (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0);
        double originalTotal = booking.getTotalAmount() != null ? booking.getTotalAmount() : finalAmount;
        double discount = Math.max(0, originalTotal - finalAmount);

        // Calculate and award points (1 point per ₹100 spent)
        int pointsEarned = Math.max(1, (int) (finalAmount / 100));

        User customer = booking.getUser();
        if (customer != null) {
            customer.setPoints((customer.getPoints() != null ? customer.getPoints() : 0) + pointsEarned);
            if (customer.getPoints() >= 1000) {
                customer.setTier(Tier.PLATINUM);
            } else if (customer.getPoints() >= 500) {
                customer.setTier(Tier.GOLD);
            }
            userRepository.save(customer);

            // Record points in ledger
            PointsLedger ledger = new PointsLedger();
            ledger.setUser(customer);
            ledger.setChangeAmount(pointsEarned);
            ledger.setReason(PointReason.BOOKING_COMPLETED);
            ledger.setRelatedId(booking.getId());
            ledger.setCreatedAt(LocalDateTime.now());
            pointsLedgerRepository.save(ledger);

            // In-app notification
            Notification notif = Notification.builder()
                    .user(customer)
                    .title("Visit Completed & Bill Dispatched")
                    .message("Your appointment bill of ₹" + finalAmount + " has been finalized. You earned +" + pointsEarned + " Groomish points!")
                    .type(NotificationType.BOOKING)
                    .build();
            notificationRepository.save(notif);

            // Disptach Real-time Bill Email
            try {
                String invoiceNumber = booking.getPayment() != null && booking.getPayment().getInvoiceNumber() != null
                        ? booking.getPayment().getInvoiceNumber()
                        : "INV-GROOMISH-" + (System.currentTimeMillis() % 1000000);

                String paymentMethod = booking.getPayment() != null && booking.getPayment().getPaymentMethod() != null
                        ? booking.getPayment().getPaymentMethod().name()
                        : "Paid at Salon / UPI";

                emailService.sendPaymentBillEmail(
                        customer.getEmail(),
                        customer.getName(),
                        invoiceNumber,
                        booking.getBookingCode() != null ? booking.getBookingCode() : "GN-" + booking.getId().toString().substring(0, 8).toUpperCase(),
                        billItems,
                        originalTotal,
                        discount,
                        0.0, // Tax included in MRP/Service pricing
                        finalAmount,
                        paymentMethod,
                        pointsEarned,
                        booking.getCompletedAt()
                );
            } catch (Exception ex) {
                log.error("Failed to send bill email for booking {}: {}", bookingId, ex.getMessage());
            }
        }

        Booking saved = bookingRepository.save(booking);
        return toBookingResponse(saved);
    }

    private ProductResponse toProductResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .brand(p.getBrand())
                .category(p.getCategory())
                .price(p.getPrice())
                .mrp(p.getMrp())
                .volumeOrSize(p.getVolumeOrSize())
                .stockQuantity(p.getStockQuantity())
                .image(p.getImage())
                .inStorePickupOnly(p.getInStorePickupOnly())
                .active(p.getActive())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private BookingResponse toBookingResponse(Booking b) {
        BookingResponse dto = new BookingResponse();
        dto.setId(b.getId());
        dto.setBookingCode(b.getBookingCode() != null ? b.getBookingCode() : "GN-" + b.getId().toString().substring(0, 8).toUpperCase());
        dto.setUserId(b.getUser() != null ? b.getUser().getId() : null);
        dto.setUserName(b.getUser() != null ? b.getUser().getName() : null);
        dto.setPaymentId(b.getPayment() != null ? b.getPayment().getId() : null);
        dto.setCouponId(b.getCoupon() != null ? b.getCoupon().getId() : null);
        dto.setTotalAmount(b.getTotalAmount());
        dto.setPricePaid(b.getPricePaid());
        dto.setStatus(b.getStatus() != null ? b.getStatus().name() : null);
        dto.setScheduledAt(b.getScheduledAt());
        dto.setNote(b.getNote());
        dto.setBookedBy(b.getBookedBy());

        if (b.getBookingItems() != null && !b.getBookingItems().isEmpty()) {
            BookingItem first = b.getBookingItems().get(0);
            dto.setServiceId(first.getService() != null ? first.getService().getId() : null);
            dto.setServiceName(first.getServiceNameSnapshot());
        }

        // Map attached products
        List<BookingProduct> prods = bookingProductRepository.findByBookingId(b.getId());
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

        return dto;
    }
}
