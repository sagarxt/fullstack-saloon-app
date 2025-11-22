package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.service.interfaces.ServiceAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/services")
@RequiredArgsConstructor
public class ServiceAdminController {

    private final ServiceAdminService serviceAdminService;

    @PostMapping
    public ServiceResponse createService(
            @RequestParam String name,
            @RequestParam UUID categoryId,
            @RequestParam(required = false) String description,
            @RequestParam String gender,
            @RequestParam Double mrp,
            @RequestParam Double price,
            @RequestParam Integer rewards,
            @RequestParam Integer durationMinutes,
            @RequestParam(required = false) MultipartFile image
    ) {
        return serviceAdminService.createService(
                name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image
        );
    }

    @PutMapping("/{id}")
    public ServiceResponse updateService(
            @PathVariable UUID id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Double mrp,
            @RequestParam(required = false) Double price,
            @RequestParam(required = false) Integer rewards,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestParam(required = false) MultipartFile image
    ) {
        return serviceAdminService.updateService(
                id, name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image
        );
    }

    @DeleteMapping("/{id}")
    public void deleteService(@PathVariable UUID id) {
        serviceAdminService.softDeleteService(id);
    }

    @GetMapping("/{id}")
    public ServiceResponse getService(@PathVariable UUID id) {
        return serviceAdminService.getService(id);
    }

    @GetMapping
    public Page<ServiceResponse> searchServices(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return serviceAdminService.searchServices(
                name, categoryId, gender, active, minPrice, maxPrice, pageable
        );
    }
}
