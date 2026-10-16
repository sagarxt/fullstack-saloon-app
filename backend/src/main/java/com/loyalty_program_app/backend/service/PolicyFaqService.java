package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.dto.policyfaq.PolicyFaqRequest;
import com.loyalty_program_app.backend.dto.policyfaq.PolicyFaqResponse;
import com.loyalty_program_app.backend.enums.PolicyFaqType;

import java.util.List;
import java.util.UUID;

public interface PolicyFaqService {

    List<PolicyFaqResponse> getPublicItems(PolicyFaqType type);

    List<PolicyFaqResponse> getAllItemsForAdmin(PolicyFaqType type);

    PolicyFaqResponse getItemById(UUID id);

    PolicyFaqResponse createItem(PolicyFaqRequest request);

    PolicyFaqResponse updateItem(UUID id, PolicyFaqRequest request);

    PolicyFaqResponse toggleItemStatus(UUID id);

    void forceDeleteItem(UUID id);
}
