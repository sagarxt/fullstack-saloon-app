package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.service.ServiceRequest;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.service.admin.ServiceAdminService;
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
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @PostMapping(consumes = {"multipart/form-data"})
    public ServiceResponse createServiceMultipart(
            @RequestParam String name,
            @RequestParam UUID categoryId,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "UNISEX") String gender,
            @RequestParam Double mrp,
            @RequestParam Double price,
            @RequestParam(required = false) Integer rewards,
            @RequestParam(defaultValue = "30") Integer durationMinutes,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) String imageUrl,
            @RequestParam(required = false) String subServicesJson
    ) {
        java.util.List<com.loyalty_program_app.backend.dto.service.SubServiceDto> subList = null;
        if (subServicesJson != null && !subServicesJson.isBlank()) {
            try {
                subList = objectMapper.readValue(subServicesJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<com.loyalty_program_app.backend.dto.service.SubServiceDto>>() {});
            } catch (Exception e) {
                // ignore parsing error
            }
        }
        return serviceAdminService.createService(
                name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image, imageUrl, subList
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
                request.getSubServices()
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
            @RequestParam(required = false) String subServicesJson
    ) {
        java.util.List<com.loyalty_program_app.backend.dto.service.SubServiceDto> subList = null;
        if (subServicesJson != null && !subServicesJson.isBlank()) {
            try {
                subList = objectMapper.readValue(subServicesJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<com.loyalty_program_app.backend.dto.service.SubServiceDto>>() {});
            } catch (Exception e) {
                // ignore parsing error
            }
        }
        return serviceAdminService.updateService(
                id, name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image, imageUrl, subList
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
                request.getSubServices()
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
        return serviceAdminService.searchServices(name, categoryId, gender, active, minPrice, maxPrice, pageable);
    }
}
