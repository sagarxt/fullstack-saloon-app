package com.loyalty_program_app.backend.dto.user;

import lombok.Data;

@Data
public class ChangePasswordRequest {

    private String currentPassword;
    private String newPassword;
}
