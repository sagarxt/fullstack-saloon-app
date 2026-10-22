package com.loyalty_program_app.backend.service.admin;

import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface ServiceAdminService {

    ServiceResponse createService(
            String name,
            UUID categoryId,
            String description,
            String gender,
            Double mrp,
            Double price,
            Integer rewards,
            Integer durationMinutes,
            MultipartFile image
    );

    ServiceResponse createService(
            String name,
            UUID categoryId,
            String description,
            String gender,
            Double mrp,
            Double price,
            Integer rewards,
            Integer durationMinutes,
            MultipartFile image,
            String imageUrl
    );

    ServiceResponse createService(
            String name,
            UUID categoryId,
            String description,
            String gender,
            Double mrp,
            Double price,
            Integer rewards,
            Integer durationMinutes,
            MultipartFile image,
            String imageUrl,
            java.util.List<com.loyalty_program_app.backend.dto.service.SubServiceDto> subServices
    );

    ServiceResponse createService(
            String name,
            UUID categoryId,
            String description,
            String gender,
            Double mrp,
            Double price,
            Integer rewards,
            Integer durationMinutes,
            MultipartFile image,
            String imageUrl,
            java.util.List<com.loyalty_program_app.backend.dto.service.SubServiceDto> subServices,
            Boolean active
    );

    ServiceResponse updateService(
            UUID id,
            String name,
            UUID categoryId,
            String description,
            String gender,
            Double mrp,
            Double price,
            Integer rewards,
            Integer durationMinutes,
            MultipartFile image
    );

    ServiceResponse updateService(
            UUID id,
            String name,
            UUID categoryId,
            String description,
            String gender,
            Double mrp,
            Double price,
            Integer rewards,
            Integer durationMinutes,
            MultipartFile image,
            String imageUrl
    );

    ServiceResponse updateService(
            UUID id,
            String name,
            UUID categoryId,
            String description,
            String gender,
            Double mrp,
            Double price,
            Integer rewards,
            Integer durationMinutes,
            MultipartFile image,
            String imageUrl,
            java.util.List<com.loyalty_program_app.backend.dto.service.SubServiceDto> subServices
    );

    ServiceResponse updateService(
            UUID id,
            String name,
            UUID categoryId,
            String description,
            String gender,
            Double mrp,
            Double price,
            Integer rewards,
            Integer durationMinutes,
            MultipartFile image,
            String imageUrl,
            java.util.List<com.loyalty_program_app.backend.dto.service.SubServiceDto> subServices,
            Boolean active
    );

    ServiceResponse updateServiceStatus(UUID id, Boolean active);

    void softDeleteService(UUID id);

    ServiceResponse getService(UUID id);

    Page<ServiceResponse> searchServices(
            String name,
            UUID categoryId,
            String gender,
            Boolean active,
            Double minPrice,
            Double maxPrice,
            Pageable pageable
    );
}
