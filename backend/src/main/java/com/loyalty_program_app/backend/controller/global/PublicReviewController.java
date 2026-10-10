package com.loyalty_program_app.backend.controller.global;

import com.loyalty_program_app.backend.dto.review.ServiceRatingSummaryResponse;
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
@RequestMapping("/api/v1/public/reviews")
@RequiredArgsConstructor
public class PublicReviewController {

    private final ServiceReviewService reviewService;

    @GetMapping("/service/{serviceId}")
    public ResponseEntity<Page<ServiceReviewResponse>> getReviewsForService(
            @PathVariable UUID serviceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(reviewService.getReviewsForService(serviceId, pageable));
    }

    @GetMapping("/service/{serviceId}/summary")
    public ResponseEntity<ServiceRatingSummaryResponse> getRatingSummary(
            @PathVariable UUID serviceId
    ) {
        return ResponseEntity.ok(reviewService.getRatingSummary(serviceId));
    }
}
