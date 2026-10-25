package com.groomish_now.backend.dto.admin;

import lombok.Data;
import java.util.UUID;

@Data
public class AdminResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String gender;
    private boolean active;
    private String createdAt;
}
