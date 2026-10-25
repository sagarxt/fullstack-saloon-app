package com.groomish_now.backend.dto.user;

import lombok.Data;
import java.util.UUID;
import java.util.Set;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String image;
    private String gender;
    private String role;
    private String tier;
    private Integer points;
    private Integer lifetimePoints;
    private String referralCode;
    private Boolean active;
    private UUID storeId;
    private String storeName;
    private String storeCode;
    private String token;
    private Set<String> userGroups;
    private Set<String> effectiveGroups;
    private LocalDateTime createdAt;
}
