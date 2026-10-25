package com.groomish_now.backend.service.policyfaq;

import com.groomish_now.backend.dto.policyfaq.PolicyFaqRequest;
import com.groomish_now.backend.dto.policyfaq.PolicyFaqResponse;
import com.groomish_now.backend.enums.PolicyFaqType;

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
