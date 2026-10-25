package com.groomish_now.backend.service.admin;

import com.groomish_now.backend.dto.admin.AdminRequest;
import com.groomish_now.backend.dto.admin.AdminResponse;
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
