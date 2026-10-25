package com.groomish_now.backend.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffProfileResponse {

    // Staff Info
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String image;
    private LocalDateTime createdAt;

    // Assigned Store / Branch Info
    private UUID storeId;
    private String storeName;
    private String storeCode;
    private String storeAddress;
    private String storeCity;
    private String storeState;
    private String storePincode;
    private String storePhone;
    private String storeEmail;
    private String openingTime;
    private String closingTime;
    private Boolean storeActive;
    private String storeImage;
    private List<String> storeImages;
}
