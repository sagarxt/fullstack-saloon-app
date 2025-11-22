package com.loyalty_program_app.backend.service.interfaces;

import com.loyalty_program_app.backend.dto.admin.AdminRequest;
import com.loyalty_program_app.backend.dto.admin.AdminResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminManagementService {

    AdminResponse createAdmin(AdminRequest request);

    Page<AdminResponse> listAdmins(String search, Boolean active, Pageable pageable);

    AdminResponse updateAdmin(UUID id, AdminRequest request);

    void softDeleteAdmin(UUID id);

    AdminResponse getAdmin(UUID id);
}
