package com.loyalty_program_app.backend.service.interfaces;

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
