package com.groomish_now.backend.controller.admin;

import com.groomish_now.backend.dto.policyfaq.PolicyFaqRequest;
import com.groomish_now.backend.dto.policyfaq.PolicyFaqResponse;
import com.groomish_now.backend.enums.PolicyFaqType;
import com.groomish_now.backend.service.policyfaq.PolicyFaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/policy-faq")
@RequiredArgsConstructor
public class AdminPolicyFaqController {

    private final PolicyFaqService policyFaqService;

    @GetMapping
    public List<PolicyFaqResponse> getAllItems(
            @RequestParam(required = false) PolicyFaqType type
    ) {
        return policyFaqService.getAllItemsForAdmin(type);
    }

    @GetMapping("/{id}")
    public PolicyFaqResponse getItemById(@PathVariable UUID id) {
        return policyFaqService.getItemById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PolicyFaqResponse createItem(@RequestBody PolicyFaqRequest request) {
        return policyFaqService.createItem(request);
    }

    @PutMapping("/{id}")
    public PolicyFaqResponse updateItem(
            @PathVariable UUID id,
            @RequestBody PolicyFaqRequest request
    ) {
        return policyFaqService.updateItem(id, request);
    }

    @PatchMapping("/{id}/toggle-status")
    public PolicyFaqResponse toggleStatus(@PathVariable UUID id) {
        return policyFaqService.toggleItemStatus(id);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> forceDeleteItem(@PathVariable UUID id) {
        policyFaqService.forceDeleteItem(id);
        return Map.of(
                "success", true,
                "message", "Content section force deleted successfully",
                "id", id
        );
    }
}
