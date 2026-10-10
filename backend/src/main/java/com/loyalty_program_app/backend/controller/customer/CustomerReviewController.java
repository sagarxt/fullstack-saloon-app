package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.review.ServiceReviewRequest;
import com.loyalty_program_app.backend.dto.review.ServiceReviewResponse;
import com.loyalty_program_app.backend.security.CustomUserDetails;
import com.loyalty_program_app.backend.service.review.ServiceReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/reviews")
@RequiredArgsConstructor
public class CustomerReviewController {

    private final ServiceReviewService reviewService;

    private UUID getUserId(CustomUserDetails user, HttpServletRequest request) {
        if (user != null) {
            return user.getId();
        }
        Object attr = request.getAttribute("userId");
        if (attr != null) {
            return UUID.fromString(attr.toString());
        }
        throw new RuntimeException("Unauthorized");
    }

    @PostMapping
    public ResponseEntity<ServiceReviewResponse> createReview(
            @AuthenticationPrincipal CustomUserDetails user,
            HttpServletRequest request,
            @Valid @RequestBody ServiceReviewRequest reviewRequest
    ) {
        UUID userId = getUserId(user, request);
        return ResponseEntity.ok(reviewService.createReview(userId, reviewRequest));
    }

    @GetMapping("/my")
    public ResponseEntity<Page<ServiceReviewResponse>> getMyReviews(
            @AuthenticationPrincipal CustomUserDetails user,
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        UUID userId = getUserId(user, request);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(reviewService.getMyReviews(userId, pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(
            @AuthenticationPrincipal CustomUserDetails user,
            HttpServletRequest request,
            @PathVariable UUID id
    ) {
        UUID userId = getUserId(user, request);
        reviewService.deleteReview(id, userId, false);
        return ResponseEntity.noContent().build();
    }
}
