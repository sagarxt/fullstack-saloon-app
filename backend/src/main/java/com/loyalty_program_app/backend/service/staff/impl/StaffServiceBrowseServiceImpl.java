package com.loyalty_program_app.backend.service.staff.impl;

import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.enums.Gender;
import com.loyalty_program_app.backend.model.ServiceEntity;
import com.loyalty_program_app.backend.repository.ServiceRepository;
import com.loyalty_program_app.backend.service.staff.StaffServiceBrowseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffServiceBrowseServiceImpl implements StaffServiceBrowseService {

    private final ServiceRepository serviceRepository;

    @Override
    public Page<ServiceResponse> listServices(String search, UUID categoryId, String gender, Pageable pageable) {

        Specification<ServiceEntity> spec = Specification.allOf((root, query, cb) ->
                cb.isTrue(root.get("active"))
        );

        if (search != null && !search.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"));
        }

        if (categoryId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("category").get("id"), categoryId));
        }

        if (gender != null && !gender.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("gender"), Gender.valueOf(gender)));
        }

        return serviceRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Override
    public ServiceResponse getServiceById(UUID id) {
        ServiceEntity s = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        return toDto(s);
    }

    private ServiceResponse toDto(ServiceEntity s) {
        ServiceResponse dto = new ServiceResponse();
        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setDescription(s.getDescription());
        dto.setImage(s.getImage());
        dto.setGender(s.getGender().name());
        dto.setMrp(s.getMrp());
        dto.setPrice(s.getPrice());
        dto.setDurationMinutes(s.getDurationMinutes());
        dto.setRewards(s.getRewards());
        dto.setCategoryId(s.getCategory().getId());
        dto.setCategoryName(s.getCategory().getName());
        dto.setActive(s.isActive());
        return dto;
    }
}
