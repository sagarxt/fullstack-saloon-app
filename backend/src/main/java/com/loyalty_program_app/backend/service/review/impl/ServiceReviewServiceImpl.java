package com.loyalty_program_app.backend.service.review.impl;

import com.loyalty_program_app.backend.dto.review.ServiceRatingSummaryResponse;
import com.loyalty_program_app.backend.dto.review.ServiceReviewRequest;
import com.loyalty_program_app.backend.dto.review.ServiceReviewResponse;
import com.loyalty_program_app.backend.model.ServiceEntity;
import com.loyalty_program_app.backend.model.ServiceReview;
import com.loyalty_program_app.backend.model.User;
import com.loyalty_program_app.backend.repository.ServiceRepository;
import com.loyalty_program_app.backend.repository.ServiceReviewRepository;
import com.loyalty_program_app.backend.repository.UserRepository;
import com.loyalty_program_app.backend.service.review.ServiceReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ServiceReviewServiceImpl implements ServiceReviewService {

    private final ServiceReviewRepository reviewRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ServiceReviewResponse createReview(UUID userId, ServiceReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ServiceEntity service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        ServiceReview review = ServiceReview.builder()
                .user(user)
                .service(service)
                .rating(request.getRating())
                .review(request.getReview().trim())
                .build();

        ServiceReview saved = reviewRepository.save(review);
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
                .userId(r.getUser() != null ? r.getUser().getId() : null)
                .userName(r.getUser() != null ? r.getUser().getName() : "Customer")
                .userImage(r.getUser() != null ? r.getUser().getImage() : null)
                .rating(r.getRating())
                .review(r.getReview())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
