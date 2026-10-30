package com.groomish_now.backend.service.admin;

import com.groomish_now.backend.dto.cohort.CohortRequest;
import com.groomish_now.backend.dto.cohort.CohortResponse;
import com.groomish_now.backend.dto.user.UserResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface CohortAdminService {

    List<CohortResponse> listCohorts();

    CohortResponse getCohort(UUID id);

    CohortResponse createCohort(CohortRequest request);

    CohortResponse updateCohort(UUID id, CohortRequest request);

    void deleteCohort(UUID id);

    CohortResponse toggleCohortStatus(UUID id, Boolean active);

    Map<String, Object> applyCohortToUsers(UUID id);

    Map<String, Object> applyAllCohortsToUsers();

    List<UserResponse> getCohortUsers(UUID id);

    List<Map<String, String>> getAvailableUserGroupsCatalog();
}
