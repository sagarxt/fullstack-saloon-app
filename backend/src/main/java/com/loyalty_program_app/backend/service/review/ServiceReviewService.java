package com.loyalty_program_app.backend.service.review;

import com.loyalty_program_app.backend.dto.review.ServiceRatingSummaryResponse;
import com.loyalty_program_app.backend.dto.review.ServiceReviewRequest;
import com.loyalty_program_app.backend.dto.review.ServiceReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ServiceReviewService {

    ServiceReviewResponse createReview(UUID userId, ServiceReviewRequest request);

    Page<ServiceReviewResponse> getReviewsForService(UUID serviceId, Pageable pageable);

    ServiceRatingSummaryResponse getRatingSummary(UUID serviceId);

    Page<ServiceReviewResponse> getMyReviews(UUID userId, Pageable pageable);

    void deleteReview(UUID reviewId, UUID userId, boolean isAdmin);

    Page<ServiceReviewResponse> getAllReviewsForAdmin(Pageable pageable);
}
