package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.review.ServiceReviewResponse;
import com.loyalty_program_app.backend.service.review.ServiceReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ServiceReviewService reviewService;

    @GetMapping
    public ResponseEntity<Page<ServiceReviewResponse>> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(reviewService.getAllReviewsForAdmin(pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable UUID id) {
        reviewService.deleteReview(id, null, true);
        return ResponseEntity.noContent().build();
    }
}
