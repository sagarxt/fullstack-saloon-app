package com.loyalty_program_app.backend.service.admin.impl;

import com.loyalty_program_app.backend.dto.maintenance.ClearDatabaseRequest;
import com.loyalty_program_app.backend.dto.maintenance.ClearDatabaseResponse;
import com.loyalty_program_app.backend.enums.Role;
import com.loyalty_program_app.backend.model.*;
import com.loyalty_program_app.backend.repository.*;
import com.loyalty_program_app.backend.service.admin.AdminMaintenanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminMaintenanceServiceImpl implements AdminMaintenanceService {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final BookingRepository bookingRepository;
    private final BookingItemRepository bookingItemRepository;
    private final BookingProductRepository bookingProductRepository;
    private final BookingTimelineRepository bookingTimelineRepository;
    private final PaymentRepository paymentRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CouponRepository couponRepository;
    private final RedeemedVoucherRepository redeemedVoucherRepository;
    private final RewardRepository rewardRepository;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final ReferralRepository referralRepository;
    private final NotificationRepository notificationRepository;
    private final ServiceReviewRepository serviceReviewRepository;
    private final StoreServiceAvailabilityRepository storeServiceAvailabilityRepository;
    private final StoreProductInventoryRepository storeProductInventoryRepository;

    @Override
    @Transactional
    public ClearDatabaseResponse clearDatabases(ClearDatabaseRequest request) {
        boolean clearAll = Boolean.TRUE.equals(request.getAll());
        Map<String, Integer> counts = new LinkedHashMap<>();

        boolean doBookings = clearAll || Boolean.TRUE.equals(request.getBookings());
        boolean doRewardPoints = clearAll || Boolean.TRUE.equals(request.getRewardPoints());
        boolean doNotifications = clearAll || Boolean.TRUE.equals(request.getNotifications());
        boolean doCustomers = clearAll || Boolean.TRUE.equals(request.getCustomers());
        boolean doStaff = clearAll || Boolean.TRUE.equals(request.getStaff());
        boolean doServices = clearAll || Boolean.TRUE.equals(request.getServices());
        boolean doCategories = clearAll || Boolean.TRUE.equals(request.getCategories());
        boolean doProducts = clearAll || Boolean.TRUE.equals(request.getProducts());
        boolean doBrands = Boolean.TRUE.equals(request.getBrands());
        boolean doCoupons = clearAll || Boolean.TRUE.equals(request.getCoupons());
        boolean doStores = clearAll || Boolean.TRUE.equals(request.getStores());

        // 1. Purge Bookings
        if (doBookings || clearAll) {
            int bCount = (int) bookingRepository.count();
            bookingTimelineRepository.deleteAll();
            bookingProductRepository.deleteAll();
            bookingItemRepository.deleteAll();
            bookingRepository.deleteAll();
            try {
                paymentRepository.deleteAll();
            } catch (Exception ignored) {}
            counts.put("bookings", bCount);
        }

        // 2. Purge Reward points & referrals
        if (doRewardPoints || clearAll) {
            int pCount = (int) pointsLedgerRepository.count();
            redeemedVoucherRepository.deleteAll();
            referralRepository.deleteAll();
            pointsLedgerRepository.deleteAll();
            counts.put("rewardPoints", pCount);
        }

        // 3. Purge Notifications
        if (doNotifications || clearAll) {
            int nCount = (int) notificationRepository.count();
            notificationRepository.deleteAll();
            counts.put("notifications", nCount);
        }

        // 4. Purge Coupons
        if (doCoupons || clearAll) {
            int cCount = (int) couponRepository.count();
            redeemedVoucherRepository.deleteAll();
            // Disassociate coupon from bookings if bookings still exist
            bookingRepository.findAll().stream()
                    .filter(b -> b.getCoupon() != null)
                    .forEach(b -> {
                        b.setCoupon(null);
                        bookingRepository.save(b);
                    });
            couponRepository.deleteAll();
            counts.put("coupons", cCount);
        }

        // 5. Purge Carts if touching services, products, customers or stores
        if (clearAll || doServices || doProducts || doCustomers || doStores) {
            cartItemRepository.deleteAll();
            cartRepository.deleteAll();
        }

        // 6. Purge Reviews if touching services or customers
        if (clearAll || doServices || doCustomers) {
            serviceReviewRepository.deleteAll();
        }

        // 7. Purge Store availability & inventory
        if (clearAll || doStores || doServices) {
            storeServiceAvailabilityRepository.deleteAll();
        }
        if (clearAll || doStores || doProducts) {
            storeProductInventoryRepository.deleteAll();
        }

        // 8. Purge Products / Brands
        if (doProducts || clearAll) {
            int prCount = (int) productRepository.count();
            storeProductInventoryRepository.deleteAll();
            bookingProductRepository.deleteAll();
            productRepository.deleteAll();
            counts.put("products", prCount);
        } else if (doBrands) {
            List<Product> withBrand = productRepository.findAll().stream()
                    .filter(p -> p.getBrand() != null && !p.getBrand().isBlank())
                    .toList();
            int brCount = withBrand.size();
            for (Product p : withBrand) {
                p.setBrand(null);
            }
            productRepository.saveAll(withBrand);
            counts.put("brands", brCount);
        }

        // 9. Purge Services
        if (doServices || clearAll) {
            int sCount = (int) serviceRepository.count();
            storeServiceAvailabilityRepository.deleteAll();
            serviceReviewRepository.deleteAll();
            bookingItemRepository.findAll().forEach(bi -> {
                bi.setService(null);
                bookingItemRepository.save(bi);
            });
            serviceRepository.deleteAll();
            counts.put("services", sCount);
        }

        // 10. Purge Categories
        if (doCategories || clearAll) {
            int catCount = (int) categoryRepository.count();
            List<ServiceEntity> services = serviceRepository.findAll();
            for (ServiceEntity s : services) {
                s.setCategory(null);
            }
            serviceRepository.saveAll(services);
            categoryRepository.deleteAll();
            counts.put("categories", catCount);
        }

        // 11. Purge Stores
        if (doStores || clearAll) {
            int stCount = (int) storeRepository.count();
            storeServiceAvailabilityRepository.deleteAll();
            storeProductInventoryRepository.deleteAll();
            userRepository.findAll().stream()
                    .filter(u -> u.getStore() != null)
                    .forEach(u -> {
                        u.setStore(null);
                        userRepository.save(u);
                    });
            bookingRepository.findAll().stream()
                    .filter(b -> b.getStore() != null)
                    .forEach(b -> {
                        b.setStore(null);
                        bookingRepository.save(b);
                    });
            storeRepository.deleteAll();
            counts.put("stores", stCount);
        }

        // 12. Purge Customers (ROLE_CUSTOMER)
        if (doCustomers || clearAll) {
            List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER);
            int custCount = customers.size();
            for (User u : customers) {
                notificationRepository.deleteAllByUserId(u.getId());
                pointsLedgerRepository.deleteAll(pointsLedgerRepository.findByUserId(u.getId()));
                referralRepository.findAll().stream()
                        .filter(r -> (r.getReferrer() != null && r.getReferrer().getId().equals(u.getId()))
                                || (r.getReferred() != null && r.getReferred().getId().equals(u.getId())))
                        .forEach(referralRepository::delete);
                redeemedVoucherRepository.deleteAll(redeemedVoucherRepository.findByUserIdOrderByCreatedAtDesc(u.getId()));
                cartRepository.findAll().stream()
                        .filter(c -> c.getUser() != null && c.getUser().getId().equals(u.getId()))
                        .forEach(cartRepository::delete);

                bookingRepository.findAll().stream()
                        .filter(b -> b.getUser() != null && b.getUser().getId().equals(u.getId()))
                        .forEach(b -> {
                            bookingRepository.delete(b);
                        });
            }
            userRepository.deleteAll(customers);
            counts.put("customers", custCount);
        }

        // 13. Purge Staff (ROLE_STAFF)
        if (doStaff || clearAll) {
            List<User> staffMembers = userRepository.findByRole(Role.ROLE_STAFF);
            int staffCount = staffMembers.size();
            for (User s : staffMembers) {
                notificationRepository.deleteAllByUserId(s.getId());
                cartRepository.findAll().stream()
                        .filter(c -> c.getUser() != null && c.getUser().getId().equals(s.getId()))
                        .forEach(cartRepository::delete);
            }
            userRepository.deleteAll(staffMembers);
            counts.put("staff", staffCount);
        }

        // NOTE: ADMIN users (Role.ROLE_ADMIN) are strictly preserved and never touched!
        long remainingAdmins = userRepository.findByRole(Role.ROLE_ADMIN).size();
        log.info("Database reset completed. Total remaining admin accounts preserved: {}", remainingAdmins);

        return ClearDatabaseResponse.builder()
                .success(true)
                .message("Selected database entities cleared successfully. Admin accounts preserved.")
                .clearedCounts(counts)
                .build();
    }

    @Override
    @Transactional
    public void forceDeleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        List<ServiceEntity> services = serviceRepository.findByCategoryId(id);
        for (ServiceEntity service : services) {
            cartItemRepository.findAll().stream()
                    .filter(ci -> ci.getService() != null && ci.getService().getId().equals(service.getId()))
                    .forEach(cartItemRepository::delete);
            storeServiceAvailabilityRepository.findAll().stream()
                    .filter(sa -> sa.getService() != null && sa.getService().getId().equals(service.getId()))
                    .forEach(storeServiceAvailabilityRepository::delete);
            serviceReviewRepository.findAll().stream()
                    .filter(sr -> sr.getService() != null && sr.getService().getId().equals(service.getId()))
                    .forEach(serviceReviewRepository::delete);
            bookingItemRepository.findAll().stream()
                    .filter(bi -> bi.getService() != null && bi.getService().getId().equals(service.getId()))
                    .forEach(bi -> {
                        bi.setService(null);
                        bookingItemRepository.save(bi);
                    });
            serviceRepository.delete(service);
        }

        categoryRepository.delete(category);
    }

    @Override
    @Transactional
    public void forceDeleteService(UUID id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        cartItemRepository.findAll().stream()
                .filter(ci -> ci.getService() != null && ci.getService().getId().equals(id))
                .forEach(cartItemRepository::delete);
        storeServiceAvailabilityRepository.findAll().stream()
                .filter(sa -> sa.getService() != null && sa.getService().getId().equals(id))
                .forEach(storeServiceAvailabilityRepository::delete);
        serviceReviewRepository.findAll().stream()
                .filter(sr -> sr.getService() != null && sr.getService().getId().equals(id))
                .forEach(serviceReviewRepository::delete);
        bookingItemRepository.findAll().stream()
                .filter(bi -> bi.getService() != null && bi.getService().getId().equals(id))
                .forEach(bi -> {
                    bi.setService(null);
                    bookingItemRepository.save(bi);
                });

        serviceRepository.delete(service);
    }

    @Override
    @Transactional
    public void forceDeleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        cartItemRepository.findAll().stream()
                .filter(ci -> ci.getProduct() != null && ci.getProduct().getId().equals(id))
                .forEach(cartItemRepository::delete);
        storeProductInventoryRepository.findAll().stream()
                .filter(spi -> spi.getProduct() != null && spi.getProduct().getId().equals(id))
                .forEach(storeProductInventoryRepository::delete);
        bookingProductRepository.findAll().stream()
                .filter(bp -> bp.getProduct() != null && bp.getProduct().getId().equals(id))
                .forEach(bookingProductRepository::delete);

        productRepository.delete(product);
    }

    @Override
    @Transactional
    public void forceDeleteStore(UUID id) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store not found with id: " + id));

        var availabilities = storeServiceAvailabilityRepository.findByStoreId(id);
        if (!availabilities.isEmpty()) {
            storeServiceAvailabilityRepository.deleteAll(availabilities);
        }
        var inventories = storeProductInventoryRepository.findByStoreId(id);
        if (!inventories.isEmpty()) {
            storeProductInventoryRepository.deleteAll(inventories);
        }

        userRepository.findAll().stream()
                .filter(u -> u.getStore() != null && u.getStore().getId().equals(id))
                .forEach(u -> {
                    u.setStore(null);
                    userRepository.save(u);
                });

        cartRepository.findAll().stream()
                .filter(c -> c.getStore() != null && c.getStore().getId().equals(id))
                .forEach(c -> {
                    c.setStore(null);
                    cartRepository.save(c);
                });

        bookingRepository.findAll().stream()
                .filter(b -> b.getStore() != null && b.getStore().getId().equals(id))
                .forEach(b -> {
                    b.setStore(null);
                    bookingRepository.save(b);
                });

        storeRepository.delete(store);
    }

    @Override
    @Transactional
    public void forceDeleteCustomer(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        if (user.getRole() == Role.ROLE_ADMIN) {
            throw new RuntimeException("Cannot delete Administrator account.");
        }

        notificationRepository.deleteAllByUserId(id);
        pointsLedgerRepository.deleteAll(pointsLedgerRepository.findByUserId(id));
        referralRepository.findAll().stream()
                .filter(r -> (r.getReferrer() != null && r.getReferrer().getId().equals(id))
                        || (r.getReferred() != null && r.getReferred().getId().equals(id)))
                .forEach(referralRepository::delete);
        redeemedVoucherRepository.deleteAll(redeemedVoucherRepository.findByUserIdOrderByCreatedAtDesc(id));

        cartRepository.findAll().stream()
                .filter(c -> c.getUser() != null && c.getUser().getId().equals(id))
                .forEach(cartRepository::delete);

        bookingRepository.findAll().stream()
                .filter(b -> b.getUser() != null && b.getUser().getId().equals(id))
                .forEach(bookingRepository::delete);

        userRepository.delete(user);
    }

    @Override
    @Transactional
    public void forceDeleteStaff(UUID id) {
        User staff = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff member not found with id: " + id));
        if (staff.getRole() == Role.ROLE_ADMIN) {
            throw new RuntimeException("Cannot delete Administrator account.");
        }

        notificationRepository.deleteAllByUserId(id);
        cartRepository.findAll().stream()
                .filter(c -> c.getUser() != null && c.getUser().getId().equals(id))
                .forEach(cartRepository::delete);

        userRepository.delete(staff);
    }

    @Override
    @Transactional
    public void forceDeleteCoupon(UUID id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found with id: " + id));
        bookingRepository.findAll().stream()
                .filter(b -> b.getCoupon() != null && b.getCoupon().getId().equals(id))
                .forEach(b -> {
                    b.setCoupon(null);
                    bookingRepository.save(b);
                });
        couponRepository.delete(coupon);
    }

    @Override
    @Transactional
    public void forceDeleteBooking(UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));

        bookingTimelineRepository.deleteAll(bookingTimelineRepository.findByBookingIdOrderByCreatedAtAsc(id));
        bookingItemRepository.findAll().stream()
                .filter(bi -> bi.getBooking() != null && bi.getBooking().getId().equals(id))
                .forEach(bookingItemRepository::delete);
        bookingProductRepository.findAll().stream()
                .filter(bp -> bp.getBooking() != null && bp.getBooking().getId().equals(id))
                .forEach(bookingProductRepository::delete);

        if (booking.getPayment() != null) {
            try {
                paymentRepository.delete(booking.getPayment());
            } catch (Exception ignored) {}
        }

        bookingRepository.delete(booking);
    }

    @Override
    @Transactional
    public void forceDeleteReward(UUID id) {
        Reward reward = rewardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reward not found with id: " + id));
        redeemedVoucherRepository.findAll().stream()
                .filter(rv -> rv.getReward() != null && rv.getReward().getId().equals(id))
                .forEach(redeemedVoucherRepository::delete);
        rewardRepository.delete(reward);
    }

    @Override
    @Transactional
    public void forceDeleteReview(UUID id) {
        serviceReviewRepository.deleteById(id);
    }
}
