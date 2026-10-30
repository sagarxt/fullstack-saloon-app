package com.groomish_now.backend.service.admin.impl;

import com.groomish_now.backend.dto.cohort.CohortRequest;
import com.groomish_now.backend.dto.cohort.CohortResponse;
import com.groomish_now.backend.dto.user.UserResponse;
import com.groomish_now.backend.enums.BookingStatus;
import com.groomish_now.backend.enums.Role;
import com.groomish_now.backend.mapper.UserMapper;
import com.groomish_now.backend.model.Booking;
import com.groomish_now.backend.model.Cohort;
import com.groomish_now.backend.model.User;
import com.groomish_now.backend.repository.BookingRepository;
import com.groomish_now.backend.repository.CohortRepository;
import com.groomish_now.backend.repository.UserRepository;
import com.groomish_now.backend.service.admin.CohortAdminService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CohortAdminServiceImpl implements CohortAdminService {

    private final CohortRepository cohortRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final UserMapper userMapper;

    // Helper class for caching customer metrics during cohort evaluation
    public static class CustomerMetrics {
        long accountAgeDays;
        int lifetimePoints;
        int currentPoints;
        double totalSpend;
        int bookingsCount;
        Long daysSinceLastVisit;
    }

    @PostConstruct
    public void initDefaultCohorts() {
        if (cohortRepository.count() > 0) {
            return;
        }
        log.info("Seeding initial default cohorts into database...");

        List<Cohort> defaults = List.of(
            Cohort.builder()
                .name("New Customers")
                .code("NEW_USER")
                .description("Joined within last 30 days or first appointment pending")
                .color("blue")
                .active(true)
                .autoApply(true)
                .isDefault(true)
                .conditionOperator("AND")
                .maxDaysSinceRegistration(30)
                .build(),

            Cohort.builder()
                .name("Silver Tier")
                .code("SILVER")
                .description("Standard entry-level salon patrons (1x multiplier)")
                .color("slate")
                .active(true)
                .autoApply(true)
                .isDefault(true)
                .conditionOperator("AND")
                .eligibleTiers(Set.of("SILVER"))
                .build(),

            Cohort.builder()
                .name("Gold Tier")
                .code("GOLD")
                .description("VIP salon patrons with 1.5x coin earn rate")
                .color("amber")
                .active(true)
                .autoApply(true)
                .isDefault(true)
                .conditionOperator("AND")
                .eligibleTiers(Set.of("GOLD"))
                .build(),

            Cohort.builder()
                .name("Platinum Tier")
                .code("PLATINUM")
                .description("Premier patrons with 2x coin multiplier and priority perks")
                .color("indigo")
                .active(true)
                .autoApply(true)
                .isDefault(true)
                .conditionOperator("AND")
                .eligibleTiers(Set.of("PLATINUM"))
                .build(),

            Cohort.builder()
                .name("Diamond Tier")
                .code("DIAMOND")
                .description("Elite salon patrons with highest lifetime loyalty")
                .color("purple")
                .active(true)
                .autoApply(true)
                .isDefault(true)
                .conditionOperator("AND")
                .eligibleTiers(Set.of("DIAMOND"))
                .build(),

            Cohort.builder()
                .name("VIP Members")
                .code("VIP")
                .description("High-value patrons with >= ₹5,000 spend or >= 300 lifetime points")
                .color("groomish-orange")
                .active(true)
                .autoApply(true)
                .isDefault(true)
                .conditionOperator("OR")
                .minTotalSpend(5000.0)
                .minLifetimePoints(300)
                .build(),

            Cohort.builder()
                .name("Frequent Visitors")
                .code("FREQUENT_VISITOR")
                .description("Repeat clients with 3+ completed appointments or visit within last 30 days")
                .color("emerald")
                .active(true)
                .autoApply(true)
                .isDefault(true)
                .conditionOperator("OR")
                .minBookingsCount(3)
                .maxDaysSinceLastVisit(30)
                .build(),

            Cohort.builder()
                .name("Churn Risk / Inactive")
                .code("CHURN_RISK")
                .description("Clients with no salon visit in the last 60 days")
                .color("rose")
                .active(true)
                .autoApply(true)
                .isDefault(true)
                .conditionOperator("AND")
                .minDaysSinceLastVisit(60)
                .build(),

            Cohort.builder()
                .name("1 Year+ Loyalists")
                .code("1_YEAR_PLUS")
                .description("Patrons registered for over 1 year (365+ days)")
                .color("cyan")
                .active(true)
                .autoApply(true)
                .isDefault(true)
                .conditionOperator("AND")
                .minDaysSinceRegistration(365)
                .build(),

            Cohort.builder()
                .name("2 Years+ Ambassadors")
                .code("2_YEAR_PLUS")
                .description("Long-term VIP patrons active for 2+ years (730+ days)")
                .color("purple")
                .active(true)
                .autoApply(true)
                .isDefault(true)
                .conditionOperator("AND")
                .minDaysSinceRegistration(730)
                .build()
        );

        cohortRepository.saveAll(defaults);
        log.info("Seeded {} default cohorts.", defaults.size());
    }

    @Override
    public List<CohortResponse> listCohorts() {
        List<Cohort> cohorts = cohortRepository.findAllByOrderByCreatedAtAsc();
        List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER);
        Map<UUID, CustomerMetrics> metricsCache = buildCustomerMetricsCache(customers);

        return cohorts.stream()
                .map(c -> toDto(c, customers, metricsCache))
                .collect(Collectors.toList());
    }

    @Override
    public CohortResponse getCohort(UUID id) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cohort not found with id: " + id));
        List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER);
        Map<UUID, CustomerMetrics> metricsCache = buildCustomerMetricsCache(customers);
        return toDto(cohort, customers, metricsCache);
    }

    @Override
    @Transactional
    public CohortResponse createCohort(CohortRequest request) {
        String code = request.getCode() != null && !request.getCode().isBlank()
                ? request.getCode().trim().toUpperCase().replaceAll("[^A-Z0-9_]", "_")
                : request.getName().trim().toUpperCase().replaceAll("[^A-Z0-9_]", "_");

        if (cohortRepository.existsByCodeIgnoreCase(code)) {
            throw new RuntimeException("A cohort with code '" + code + "' already exists.");
        }

        Cohort cohort = Cohort.builder()
                .name(request.getName().trim())
                .code(code)
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .color(request.getColor() != null && !request.getColor().isBlank() ? request.getColor() : "groomish-orange")
                .active(request.getActive() != null ? request.getActive() : true)
                .autoApply(request.getAutoApply() != null ? request.getAutoApply() : true)
                .conditionOperator(request.getConditionOperator() != null ? request.getConditionOperator().toUpperCase() : "AND")
                .eligibleTiers(request.getEligibleTiers() != null ? new HashSet<>(request.getEligibleTiers()) : new HashSet<>())
                .minDaysSinceRegistration(request.getMinDaysSinceRegistration())
                .maxDaysSinceRegistration(request.getMaxDaysSinceRegistration())
                .minLifetimePoints(request.getMinLifetimePoints())
                .maxLifetimePoints(request.getMaxLifetimePoints())
                .minCurrentPoints(request.getMinCurrentPoints())
                .maxCurrentPoints(request.getMaxCurrentPoints())
                .minTotalSpend(request.getMinTotalSpend())
                .maxTotalSpend(request.getMaxTotalSpend())
                .minBookingsCount(request.getMinBookingsCount())
                .maxBookingsCount(request.getMaxBookingsCount())
                .minDaysSinceLastVisit(request.getMinDaysSinceLastVisit())
                .maxDaysSinceLastVisit(request.getMaxDaysSinceLastVisit())
                .gender(request.getGender() != null && !request.getGender().isBlank() ? request.getGender().toUpperCase() : null)
                .isDefault(false)
                .build();

        Cohort saved = cohortRepository.save(cohort);

        // Auto-apply immediately if requested
        if (saved.isAutoApply() && saved.isActive()) {
            applyCohortToUsers(saved.getId());
        }

        List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER);
        Map<UUID, CustomerMetrics> metricsCache = buildCustomerMetricsCache(customers);
        return toDto(saved, customers, metricsCache);
    }

    @Override
    @Transactional
    public CohortResponse updateCohort(UUID id, CohortRequest request) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cohort not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            cohort.setName(request.getName().trim());
        }

        // Only allow changing code if custom
        if (!cohort.isDefault() && request.getCode() != null && !request.getCode().isBlank()) {
            String newCode = request.getCode().trim().toUpperCase().replaceAll("[^A-Z0-9_]", "_");
            if (!newCode.equalsIgnoreCase(cohort.getCode()) && cohortRepository.existsByCodeIgnoreCase(newCode)) {
                throw new RuntimeException("A cohort with code '" + newCode + "' already exists.");
            }
            cohort.setCode(newCode);
        }

        if (request.getDescription() != null) {
            cohort.setDescription(request.getDescription().trim());
        }
        if (request.getColor() != null && !request.getColor().isBlank()) {
            cohort.setColor(request.getColor());
        }
        if (request.getActive() != null) {
            cohort.setActive(request.getActive());
        }
        if (request.getAutoApply() != null) {
            cohort.setAutoApply(request.getAutoApply());
        }
        if (request.getConditionOperator() != null) {
            cohort.setConditionOperator(request.getConditionOperator().toUpperCase());
        }

        cohort.setEligibleTiers(request.getEligibleTiers() != null ? new HashSet<>(request.getEligibleTiers()) : new HashSet<>());
        cohort.setMinDaysSinceRegistration(request.getMinDaysSinceRegistration());
        cohort.setMaxDaysSinceRegistration(request.getMaxDaysSinceRegistration());
        cohort.setMinLifetimePoints(request.getMinLifetimePoints());
        cohort.setMaxLifetimePoints(request.getMaxLifetimePoints());
        cohort.setMinCurrentPoints(request.getMinCurrentPoints());
        cohort.setMaxCurrentPoints(request.getMaxCurrentPoints());
        cohort.setMinTotalSpend(request.getMinTotalSpend());
        cohort.setMaxTotalSpend(request.getMaxTotalSpend());
        cohort.setMinBookingsCount(request.getMinBookingsCount());
        cohort.setMaxBookingsCount(request.getMaxBookingsCount());
        cohort.setMinDaysSinceLastVisit(request.getMinDaysSinceLastVisit());
        cohort.setMaxDaysSinceLastVisit(request.getMaxDaysSinceLastVisit());
        cohort.setGender(request.getGender() != null && !request.getGender().isBlank() ? request.getGender().toUpperCase() : null);

        Cohort updated = cohortRepository.save(cohort);

        // Auto re-apply to users
        if (updated.isAutoApply() && updated.isActive()) {
            applyCohortToUsers(updated.getId());
        }

        List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER);
        Map<UUID, CustomerMetrics> metricsCache = buildCustomerMetricsCache(customers);
        return toDto(updated, customers, metricsCache);
    }

    @Override
    @Transactional
    public void deleteCohort(UUID id) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cohort not found with id: " + id));

        if (cohort.isDefault()) {
            throw new RuntimeException("Default system cohorts cannot be deleted. You can deactivate them instead.");
        }

        String code = cohort.getCode();
        // Remove code from any user who has it
        List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER);
        for (User u : customers) {
            if (u.getUserGroups() != null && u.getUserGroups().remove(code)) {
                userRepository.save(u);
            }
        }

        cohortRepository.delete(cohort);
    }

    @Override
    @Transactional
    public CohortResponse toggleCohortStatus(UUID id, Boolean active) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cohort not found with id: " + id));

        cohort.setActive(active != null ? active : !cohort.isActive());
        Cohort updated = cohortRepository.save(cohort);

        if (updated.isActive() && updated.isAutoApply()) {
            applyCohortToUsers(updated.getId());
        }

        List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER);
        Map<UUID, CustomerMetrics> metricsCache = buildCustomerMetricsCache(customers);
        return toDto(updated, customers, metricsCache);
    }

    @Override
    @Transactional
    public Map<String, Object> applyCohortToUsers(UUID id) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cohort not found with id: " + id));

        List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER);
        Map<UUID, CustomerMetrics> metricsCache = buildCustomerMetricsCache(customers);

        int addedCount = 0;
        int removedCount = 0;
        int totalMatched = 0;
        String code = cohort.getCode();

        for (User user : customers) {
            CustomerMetrics metrics = metricsCache.get(user.getId());
            boolean matches = evaluateUserMatchesCohort(user, cohort, metrics);

            Set<String> groups = user.getUserGroups();
            if (groups == null) {
                groups = new HashSet<>();
                user.setUserGroups(groups);
            }

            if (matches) {
                totalMatched++;
                if (!groups.contains(code)) {
                    groups.add(code);
                    userRepository.save(user);
                    addedCount++;
                }
            } else {
                if (groups.contains(code)) {
                    groups.remove(code);
                    userRepository.save(user);
                    removedCount++;
                }
            }
        }

        return Map.of(
            "cohortId", cohort.getId().toString(),
            "cohortCode", cohort.getCode(),
            "cohortName", cohort.getName(),
            "totalMatched", totalMatched,
            "newlyAdded", addedCount,
            "removed", removedCount,
            "message", String.format("Cohort '%s' applied! %d customers qualify (%d newly added, %d updated).",
                    cohort.getName(), totalMatched, addedCount, removedCount)
        );
    }

    @Override
    @Transactional
    public Map<String, Object> applyAllCohortsToUsers() {
        List<Cohort> activeCohorts = cohortRepository.findByActiveTrueOrderByCreatedAtAsc();
        List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER);
        Map<UUID, CustomerMetrics> metricsCache = buildCustomerMetricsCache(customers);

        int totalEvaluations = 0;
        int totalUpdatedUsers = 0;

        for (User user : customers) {
            CustomerMetrics metrics = metricsCache.get(user.getId());
            Set<String> groups = user.getUserGroups();
            if (groups == null) {
                groups = new HashSet<>();
                user.setUserGroups(groups);
            }
            boolean changed = false;

            for (Cohort cohort : activeCohorts) {
                if (!cohort.isAutoApply()) continue;
                String code = cohort.getCode();
                boolean matches = evaluateUserMatchesCohort(user, cohort, metrics);
                totalEvaluations++;

                if (matches && !groups.contains(code)) {
                    groups.add(code);
                    changed = true;
                } else if (!matches && groups.contains(code)) {
                    groups.remove(code);
                    changed = true;
                }
            }

            if (changed) {
                userRepository.save(user);
                totalUpdatedUsers++;
            }
        }

        return Map.of(
            "activeCohortsCount", activeCohorts.size(),
            "totalCustomers", customers.size(),
            "updatedCustomersCount", totalUpdatedUsers,
            "message", String.format("Synchronized %d active cohorts across %d customers! %d customers updated.",
                    activeCohorts.size(), customers.size(), totalUpdatedUsers)
        );
    }

    @Override
    public List<UserResponse> getCohortUsers(UUID id) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cohort not found with id: " + id));

        List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER);
        Map<UUID, CustomerMetrics> metricsCache = buildCustomerMetricsCache(customers);

        return customers.stream()
                .filter(u -> evaluateUserMatchesCohort(u, cohort, metricsCache.get(u.getId())))
                .map(userMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<Map<String, String>> getAvailableUserGroupsCatalog() {
        List<Cohort> cohorts = cohortRepository.findByActiveTrueOrderByCreatedAtAsc();
        if (cohorts.isEmpty()) {
            initDefaultCohorts();
            cohorts = cohortRepository.findByActiveTrueOrderByCreatedAtAsc();
        }

        return cohorts.stream()
                .map(c -> Map.of(
                    "id", c.getCode(),
                    "name", c.getName(),
                    "description", c.getDescription() != null ? c.getDescription() : "",
                    "color", c.getColor() != null ? c.getColor() : "groomish-orange"
                ))
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // RULE EVALUATION ENGINE
    // -------------------------------------------------------------------------
    public boolean evaluateUserMatchesCohort(User user, Cohort cohort, CustomerMetrics metrics) {
        if (!cohort.isActive()) {
            return false;
        }

        List<Boolean> ruleResults = new ArrayList<>();

        // 1. Eligible Tiers
        if (cohort.getEligibleTiers() != null && !cohort.getEligibleTiers().isEmpty()) {
            String userTier = user.getTier() != null ? user.getTier().name() : "SILVER";
            ruleResults.add(cohort.getEligibleTiers().contains(userTier));
        }

        // 2. Account Age
        if (cohort.getMinDaysSinceRegistration() != null) {
            ruleResults.add(metrics.accountAgeDays >= cohort.getMinDaysSinceRegistration());
        }
        if (cohort.getMaxDaysSinceRegistration() != null) {
            ruleResults.add(metrics.accountAgeDays <= cohort.getMaxDaysSinceRegistration());
        }

        // 3. Lifetime & Current Points
        if (cohort.getMinLifetimePoints() != null) {
            ruleResults.add(metrics.lifetimePoints >= cohort.getMinLifetimePoints());
        }
        if (cohort.getMaxLifetimePoints() != null) {
            ruleResults.add(metrics.lifetimePoints <= cohort.getMaxLifetimePoints());
        }
        if (cohort.getMinCurrentPoints() != null) {
            ruleResults.add(metrics.currentPoints >= cohort.getMinCurrentPoints());
        }
        if (cohort.getMaxCurrentPoints() != null) {
            ruleResults.add(metrics.currentPoints <= cohort.getMaxCurrentPoints());
        }

        // 4. Bookings & Spend
        if (cohort.getMinTotalSpend() != null) {
            ruleResults.add(metrics.totalSpend >= cohort.getMinTotalSpend());
        }
        if (cohort.getMaxTotalSpend() != null) {
            ruleResults.add(metrics.totalSpend <= cohort.getMaxTotalSpend());
        }
        if (cohort.getMinBookingsCount() != null) {
            ruleResults.add(metrics.bookingsCount >= cohort.getMinBookingsCount());
        }
        if (cohort.getMaxBookingsCount() != null) {
            ruleResults.add(metrics.bookingsCount <= cohort.getMaxBookingsCount());
        }

        // 5. Inactivity / Churn
        if (cohort.getMinDaysSinceLastVisit() != null) {
            ruleResults.add(metrics.daysSinceLastVisit != null && metrics.daysSinceLastVisit >= cohort.getMinDaysSinceLastVisit());
        }
        if (cohort.getMaxDaysSinceLastVisit() != null) {
            ruleResults.add(metrics.daysSinceLastVisit != null && metrics.daysSinceLastVisit <= cohort.getMaxDaysSinceLastVisit());
        }

        // 6. Gender
        if (cohort.getGender() != null && !cohort.getGender().isBlank() && !cohort.getGender().equalsIgnoreCase("ALL")) {
            String g = user.getGender() != null ? user.getGender().name() : "";
            ruleResults.add(g.equalsIgnoreCase(cohort.getGender()));
        }

        // If no criteria specified, match everyone
        if (ruleResults.isEmpty()) {
            return true;
        }

        // Match based on Condition Operator
        boolean isOr = "OR".equalsIgnoreCase(cohort.getConditionOperator());
        if (isOr) {
            return ruleResults.stream().anyMatch(Boolean::booleanValue);
        } else {
            return ruleResults.stream().allMatch(Boolean::booleanValue);
        }
    }

    private Map<UUID, CustomerMetrics> buildCustomerMetricsCache(List<User> customers) {
        Map<UUID, CustomerMetrics> cache = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();

        // Fetch all non-cancelled bookings to calculate spend and visit frequency
        List<Booking> allBookings = bookingRepository.findAll();
        Map<UUID, List<Booking>> userBookingsMap = allBookings.stream()
                .filter(b -> b.getUser() != null && b.getStatus() != BookingStatus.CANCELLED)
                .collect(Collectors.groupingBy(b -> b.getUser().getId()));

        for (User u : customers) {
            CustomerMetrics m = new CustomerMetrics();
            m.accountAgeDays = u.getCreatedAt() != null
                    ? ChronoUnit.DAYS.between(u.getCreatedAt(), now)
                    : 0;
            m.lifetimePoints = u.getLifetimePoints() != null ? u.getLifetimePoints() : (u.getPoints() != null ? u.getPoints() : 0);
            m.currentPoints = u.getPoints() != null ? u.getPoints() : 0;

            List<Booking> bookings = userBookingsMap.getOrDefault(u.getId(), List.of());
            m.bookingsCount = bookings.size();

            double spend = 0.0;
            LocalDateTime latestVisit = null;

            for (Booking b : bookings) {
                spend += b.getPricePaid() != null ? b.getPricePaid() : (b.getTotalAmount() != null ? b.getTotalAmount() : 0.0);
                LocalDateTime visitTime = b.getScheduledAt() != null ? b.getScheduledAt() : b.getCreatedAt();
                if (visitTime != null && (latestVisit == null || visitTime.isAfter(latestVisit))) {
                    latestVisit = visitTime;
                }
            }

            m.totalSpend = spend;
            if (latestVisit != null) {
                m.daysSinceLastVisit = ChronoUnit.DAYS.between(latestVisit, now);
            } else {
                // If never visited, days since last visit is their account age
                m.daysSinceLastVisit = m.accountAgeDays;
            }

            cache.put(u.getId(), m);
        }

        return cache;
    }

    private CohortResponse toDto(Cohort c, List<User> customers, Map<UUID, CustomerMetrics> metricsCache) {
        int matchingCount = 0;
        for (User u : customers) {
            CustomerMetrics m = metricsCache.get(u.getId());
            if (evaluateUserMatchesCohort(u, c, m)) {
                matchingCount++;
            }
        }

        return CohortResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .code(c.getCode())
                .description(c.getDescription())
                .color(c.getColor())
                .active(c.isActive())
                .autoApply(c.isAutoApply())
                .isDefault(c.isDefault())
                .conditionOperator(c.getConditionOperator())
                .eligibleTiers(c.getEligibleTiers())
                .minDaysSinceRegistration(c.getMinDaysSinceRegistration())
                .maxDaysSinceRegistration(c.getMaxDaysSinceRegistration())
                .minLifetimePoints(c.getMinLifetimePoints())
                .maxLifetimePoints(c.getMaxLifetimePoints())
                .minCurrentPoints(c.getMinCurrentPoints())
                .maxCurrentPoints(c.getMaxCurrentPoints())
                .minTotalSpend(c.getMinTotalSpend())
                .maxTotalSpend(c.getMaxTotalSpend())
                .minBookingsCount(c.getMinBookingsCount())
                .maxBookingsCount(c.getMaxBookingsCount())
                .minDaysSinceLastVisit(c.getMinDaysSinceLastVisit())
                .maxDaysSinceLastVisit(c.getMaxDaysSinceLastVisit())
                .gender(c.getGender())
                .matchingUsersCount(matchingCount)
                .ruleSummary(buildRuleSummary(c))
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private String buildRuleSummary(Cohort c) {
        List<String> rules = new ArrayList<>();
        if (c.getEligibleTiers() != null && !c.getEligibleTiers().isEmpty()) {
            rules.add("Tier in [" + String.join(", ", c.getEligibleTiers()) + "]");
        }
        if (c.getMinDaysSinceRegistration() != null) {
            rules.add("Joined >= " + c.getMinDaysSinceRegistration() + "d ago");
        }
        if (c.getMaxDaysSinceRegistration() != null) {
            rules.add("Joined <= " + c.getMaxDaysSinceRegistration() + "d ago");
        }
        if (c.getMinLifetimePoints() != null) {
            rules.add("Lifetime Points >= " + c.getMinLifetimePoints());
        }
        if (c.getMaxLifetimePoints() != null) {
            rules.add("Lifetime Points <= " + c.getMaxLifetimePoints());
        }
        if (c.getMinTotalSpend() != null) {
            rules.add("Spend >= ₹" + c.getMinTotalSpend().intValue());
        }
        if (c.getMaxTotalSpend() != null) {
            rules.add("Spend <= ₹" + c.getMaxTotalSpend().intValue());
        }
        if (c.getMinBookingsCount() != null) {
            rules.add("Visits >= " + c.getMinBookingsCount());
        }
        if (c.getMaxBookingsCount() != null) {
            rules.add("Visits <= " + c.getMaxBookingsCount());
        }
        if (c.getMinDaysSinceLastVisit() != null) {
            rules.add("Inactive >= " + c.getMinDaysSinceLastVisit() + "d");
        }
        if (c.getMaxDaysSinceLastVisit() != null) {
            rules.add("Visit within last " + c.getMaxDaysSinceLastVisit() + "d");
        }
        if (c.getGender() != null && !c.getGender().isBlank() && !c.getGender().equalsIgnoreCase("ALL")) {
            rules.add("Gender is " + c.getGender());
        }

        if (rules.isEmpty()) {
            return "All registered patrons (Universal)";
        }

        String op = " " + (c.getConditionOperator() != null ? c.getConditionOperator().toUpperCase() : "AND") + " ";
        return String.join(op, rules);
    }
}
