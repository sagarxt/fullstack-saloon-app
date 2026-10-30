package com.groomish_now.backend.controller.admin;

import com.groomish_now.backend.dto.cohort.CohortRequest;
import com.groomish_now.backend.dto.cohort.CohortResponse;
import com.groomish_now.backend.dto.user.UserResponse;
import com.groomish_now.backend.service.admin.CohortAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/cohorts")
@RequiredArgsConstructor
public class AdminCohortController {

    private final CohortAdminService cohortAdminService;

    // LIST ALL COHORTS WITH MATCHING USER COUNTS
    @GetMapping
    public List<CohortResponse> listCohorts() {
        return cohortAdminService.listCohorts();
    }

    // GET SINGLE COHORT
    @GetMapping("/{id}")
    public CohortResponse getCohort(@PathVariable UUID id) {
        return cohortAdminService.getCohort(id);
    }

    // CREATE COHORT & LOGIC
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CohortResponse createCohort(@RequestBody CohortRequest request) {
        return cohortAdminService.createCohort(request);
    }

    // MODIFY COHORT & LOGIC
    @PutMapping("/{id}")
    public CohortResponse updateCohort(
            @PathVariable UUID id,
            @RequestBody CohortRequest request
    ) {
        return cohortAdminService.updateCohort(id, request);
    }

    // DELETE COHORT
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCohort(@PathVariable UUID id) {
        cohortAdminService.deleteCohort(id);
    }

    // TOGGLE COHORT STATUS (ACTIVE / INACTIVE)
    @PutMapping("/{id}/status")
    public CohortResponse toggleCohortStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) Boolean active
    ) {
        return cohortAdminService.toggleCohortStatus(id, active);
    }

    // EVALUATE AND APPLY COHORT LOGIC TO ALL USERS
    @PostMapping("/{id}/apply")
    public Map<String, Object> applyCohortToUsers(@PathVariable UUID id) {
        return cohortAdminService.applyCohortToUsers(id);
    }

    // BULK EVALUATE AND APPLY ALL ACTIVE COHORTS TO USERS
    @PostMapping("/apply-all")
    public Map<String, Object> applyAllCohortsToUsers() {
        return cohortAdminService.applyAllCohortsToUsers();
    }

    // GET USERS MATCHING COHORT LOGIC
    @GetMapping("/{id}/users")
    public List<UserResponse> getCohortUsers(@PathVariable UUID id) {
        return cohortAdminService.getCohortUsers(id);
    }
}
