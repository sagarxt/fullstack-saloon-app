package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.admin.AdminRequest;
import com.loyalty_program_app.backend.dto.admin.AdminResponse;
import com.loyalty_program_app.backend.service.admin.AdminManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/manage-admins")
@RequiredArgsConstructor
public class AdminManagementController {

    private final AdminManagementService adminManagementService;

    @PostMapping
    public AdminResponse createAdmin(@RequestBody AdminRequest request) {
        return adminManagementService.createAdmin(request);
    }

    @GetMapping
    public Page<AdminResponse> listAdmins(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return adminManagementService.listAdmins(search, active, pageable);
    }

    @GetMapping("/{id}")
    public AdminResponse getAdmin(@PathVariable UUID id) {
        return adminManagementService.getAdmin(id);
    }

    @PutMapping("/{id}")
    public AdminResponse updateAdmin(
            @PathVariable UUID id,
            @RequestBody AdminRequest request
    ) {
        return adminManagementService.updateAdmin(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteAdmin(@PathVariable UUID id) {
        adminManagementService.softDeleteAdmin(id);
    }
}
