package com.loyalty_program_app.backend.service.review.impl;

import com.loyalty_program_app.backend.dto.review.ServiceRatingSummaryResponse;
import com.loyalty_program_app.backend.dto.review.ServiceReviewRequest;
import com.loyalty_program_app.backend.dto.review.ServiceReviewResponse;
import com.loyalty_program_app.backend.model.Booking;
import com.loyalty_program_app.backend.model.Product;
import com.loyalty_program_app.backend.model.ServiceEntity;
import com.loyalty_program_app.backend.model.ServiceReview;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.BookingRepository;
import com.loyalty_program_app.backend.repository.ProductRepository;
import com.loyalty_program_app.backend.repository.ServiceRepository;
import com.loyalty_program_app.backend.repository.ServiceReviewRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.review.ServiceReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceReviewServiceImpl implements ServiceReviewService {

    private final ServiceReviewRepository reviewRepository;
    private final ServiceRepository serviceRepository;
    private final ProductRepository productRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ServiceReviewResponse createReview(UUID userId, ServiceReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        if (request.getServiceId() == null && request.getProductId() == null) {
            throw new RuntimeException("Either serviceId or productId must be provided for a review");
        }

        ServiceEntity service = null;
        if (request.getServiceId() != null) {
            service = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new RuntimeException("Service not found"));
        }

        Product product = null;
        if (request.getProductId() != null) {
            product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));
        }

        Booking booking = null;
        if (request.getBookingId() != null) {
            booking = bookingRepository.findById(request.getBookingId())
                    .orElse(null);
        }

        // Check if an existing review exists for this user + booking + service/product, update it if present
        Optional<ServiceReview> existingReview = Optional.empty();
        if (booking != null) {
            if (service != null) {
                existingReview = reviewRepository.findFirstByUserIdAndBookingIdAndServiceId(userId, booking.getId(), service.getId());
            } else if (product != null) {
                existingReview = reviewRepository.findFirstByUserIdAndBookingIdAndProductId(userId, booking.getId(), product.getId());
            }
        } else {
            if (service != null) {
                existingReview = reviewRepository.findFirstByUserIdAndServiceId(userId, service.getId());
            } else if (product != null) {
                existingReview = reviewRepository.findFirstByUserIdAndProductId(userId, product.getId());
            }
        }

        ServiceReview reviewToSave;
        if (existingReview.isPresent()) {
            reviewToSave = existingReview.get();
            reviewToSave.setRating(request.getRating());
            reviewToSave.setReview(request.getReview() != null ? request.getReview().trim() : "");
            if (booking != null) {
                reviewToSave.setBooking(booking);
            }
        } else {
            reviewToSave = ServiceReview.builder()
                    .user(user)
                    .service(service)
                    .product(product)
                    .booking(booking)
                    .rating(request.getRating())
                    .review(request.getReview() != null ? request.getReview().trim() : "")
                    .build();
        }

        ServiceReview saved = reviewRepository.save(reviewToSave);
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ServiceReviewResponse> getReviewsForService(UUID serviceId, Pageable pageable) {
        return reviewRepository.findByServiceIdOrderByCreatedAtDesc(serviceId, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceRatingSummaryResponse getRatingSummary(UUID serviceId) {
        Double avg = reviewRepository.getAverageRatingByServiceId(serviceId);
        Long count = reviewRepository.countByServiceId(serviceId);

        return ServiceRatingSummaryResponse.builder()
                .serviceId(serviceId)
                .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalReviews(count != null ? count : 0L)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ServiceReviewResponse> getReviewsForProduct(UUID productId, Pageable pageable) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceRatingSummaryResponse getProductRatingSummary(UUID productId) {
        Double avg = reviewRepository.getAverageRatingByProductId(productId);
        Long count = reviewRepository.countByProductId(productId);

        return ServiceRatingSummaryResponse.builder()
                .serviceId(productId)
                .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalReviews(count != null ? count : 0L)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceReviewResponse> getReviewsForBooking(UUID bookingId) {
        return reviewRepository.findByBookingId(bookingId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceReviewResponse> getCustomerReviewsForBooking(UUID userId, UUID bookingId) {
        return reviewRepository.findByUserIdAndBookingId(userId, bookingId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ServiceReviewResponse> getMyReviews(UUID userId, Pageable pageable) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional
    public void deleteReview(UUID reviewId, UUID userId, boolean isAdmin) {
        ServiceReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!isAdmin && !review.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this review");
        }

        reviewRepository.delete(review);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ServiceReviewResponse> getAllReviewsForAdmin(Pageable pageable) {
        return reviewRepository.findAll(pageable).map(this::toDto);
    }

    private ServiceReviewResponse toDto(ServiceReview r) {
        return ServiceReviewResponse.builder()
                .id(r.getId())
                .serviceId(r.getService() != null ? r.getService().getId() : null)
                .serviceName(r.getService() != null ? r.getService().getName() : null)
                .productId(r.getProduct() != null ? r.getProduct().getId() : null)
                .productName(r.getProduct() != null ? r.getProduct().getName() : null)
                .bookingId(r.getBooking() != null ? r.getBooking().getId() : null)
                .userId(r.getUser() != null ? r.getUser().getId() : null)
                .userName(r.getUser() != null ? r.getUser().getName() : "Customer")
                .userImage(r.getUser() != null ? r.getUser().getImage() : null)
                .rating(r.getRating())
                .review(r.getReview())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
