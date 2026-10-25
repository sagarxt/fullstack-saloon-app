package com.groomish_now.backend.controller.admin;

import com.groomish_now.backend.dto.service.SubServiceDto;
import com.groomish_now.backend.dto.service.ServiceRequest;
import com.groomish_now.backend.dto.service.ServiceResponse;
import com.groomish_now.backend.service.admin.ServiceAdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/services")
public class AdminServiceController {

    private final ServiceAdminService serviceAdminService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public AdminServiceController(
            ServiceAdminService serviceAdminService,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper
    ) {
        this.serviceAdminService = serviceAdminService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ServiceResponse createServiceMultipart(
            @RequestParam String name,
            @RequestParam UUID categoryId,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "UNISEX") String gender,
            @RequestParam(required = false) Double mrp,
            @RequestParam(required = false) Double price,
            @RequestParam(required = false) Integer rewards,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) String imageUrl,
            @RequestParam(required = false) String subServicesJson,
            @RequestParam(required = false) Boolean active
    ) {
        java.util.List<SubServiceDto> subList = null;
        if (subServicesJson != null && !subServicesJson.isBlank()) {
            try {
                subList = objectMapper.readValue(subServicesJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<SubServiceDto>>() {});
            } catch (Exception e) {
                // ignore parsing error
            }
        }
        return serviceAdminService.createService(
                name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image, imageUrl, subList, active
        );
    }

    @PostMapping(consumes = {"application/json"})
    public ServiceResponse createServiceJson(@RequestBody ServiceRequest request) {
        return serviceAdminService.createService(
                request.getName(),
                request.getCategoryId(),
                request.getDescription(),
                request.getGender() != null ? request.getGender() : "UNISEX",
                request.getMrp() != null ? request.getMrp() : request.getPrice(),
                request.getPrice(),
                request.getRewards(),
                request.getDurationMinutes(),
                null,
                request.getImage(),
                request.getSubServices(),
                request.getActive()
        );
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ServiceResponse updateServiceMultipart(
            @PathVariable UUID id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Double mrp,
            @RequestParam(required = false) Double price,
            @RequestParam(required = false) Integer rewards,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) String imageUrl,
            @RequestParam(required = false) String subServicesJson,
            @RequestParam(required = false) Boolean active
    ) {
        java.util.List<SubServiceDto> subList = null;
        if (subServicesJson != null && !subServicesJson.isBlank()) {
            try {
                subList = objectMapper.readValue(subServicesJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<SubServiceDto>>() {});
            } catch (Exception e) {
                // ignore parsing error
            }
        }
        return serviceAdminService.updateService(
                id, name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image, imageUrl, subList, active
        );
    }

    @PutMapping(value = "/{id}", consumes = {"application/json"})
    public ServiceResponse updateServiceJson(@PathVariable UUID id, @RequestBody ServiceRequest request) {
        return serviceAdminService.updateService(
                id,
                request.getName(),
                request.getCategoryId(),
                request.getDescription(),
                request.getGender(),
                request.getMrp(),
                request.getPrice(),
                request.getRewards(),
                request.getDurationMinutes(),
                null,
                request.getImage(),
                request.getSubServices(),
                request.getActive()
        );
    }

    @PutMapping("/{id}/status")
    public ServiceResponse updateServiceStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) Boolean active
    ) {
        return serviceAdminService.updateServiceStatus(id, active);
    }

    @PatchMapping("/{id}/status")
    public ServiceResponse patchServiceStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) Boolean active
    ) {
        return serviceAdminService.updateServiceStatus(id, active);
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
            @RequestParam(defaultValue = "1000") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return serviceAdminService.searchServices(name, categoryId, gender, active, minPrice, maxPrice, pageable);
    }
}
