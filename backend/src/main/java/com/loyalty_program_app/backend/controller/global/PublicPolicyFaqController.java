package com.loyalty_program_app.backend.controller.global;

import com.loyalty_program_app.backend.dto.policyfaq.PolicyFaqResponse;
import com.loyalty_program_app.backend.enums.PolicyFaqType;
import com.loyalty_program_app.backend.service.PolicyFaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/policy-faq")
@RequiredArgsConstructor
public class PublicPolicyFaqController {

    private final PolicyFaqService policyFaqService;

    @GetMapping
    public List<PolicyFaqResponse> getPublicContent(
            @RequestParam(required = false) PolicyFaqType type
    ) {
        return policyFaqService.getPublicItems(type);
    }

    @GetMapping("/{id}")
    public PolicyFaqResponse getContentById(@PathVariable UUID id) {
        return policyFaqService.getItemById(id);
    }
}
