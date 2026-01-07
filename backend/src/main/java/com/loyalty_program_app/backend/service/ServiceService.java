package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.dto.service.ServiceRequest;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.enums.ServiceGender;
import com.loyalty_program_app.backend.model.ServiceEntity;
import com.loyalty_program_app.backend.repository.CategoryRepository;
import com.loyalty_program_app.backend.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceService {

    private final ServiceRepository serviceRepository;
    private final CategoryRepository categoryRepository;

    /* ===============================
       ADMIN + CUSTOMER
       =============================== */

    public List<ServiceResponse> getActiveServices() {
        return serviceRepository.findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ServiceResponse getServiceById(UUID id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        if (!Boolean.TRUE.equals(service.isActive())) {
            throw new RuntimeException("Service is inactive");
        }

        return toResponse(service);
    }

    /* ===============================
       ADMIN ONLY
       =============================== */

    public ServiceResponse create(ServiceRequest request) {
        ServiceEntity service = new ServiceEntity();

        mapRequest(service, request);
        service.setActive(true);

        return toResponse(serviceRepository.save(service));
    }

    public ServiceResponse update(UUID id, ServiceRequest request) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        mapRequest(service, request);

        return toResponse(serviceRepository.save(service));
    }

    public void delete(UUID id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        serviceRepository.delete(service);
    }

    /* ===============================
       MAPPERS
       =============================== */

    private void mapRequest(ServiceEntity service, ServiceRequest request) {
        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setGender(ServiceGender.valueOf(request.getGender()));
        service.setMrp(request.getMrp());
        service.setPrice(request.getPrice());
        service.setRewards(request.getRewards());
        service.setDurationMinutes(request.getDurationMinutes());
        service.setImage(request.getImage());

        service.setCategory(
                categoryRepository.findById(request.getCategoryId())
                        .orElseThrow(() -> new RuntimeException("Category not found"))
        );
    }

    private ServiceResponse toResponse(ServiceEntity service) {
        ServiceResponse res = new ServiceResponse();

        res.setId(service.getId());
        res.setName(service.getName());
        res.setDescription(service.getDescription());
        res.setGender(service.getGender().toString());
        res.setMrp(service.getMrp());
        res.setPrice(service.getPrice());
        res.setRewards(service.getRewards());
        res.setDurationMinutes(service.getDurationMinutes());
        res.setImage(service.getImage());
        res.setActive(service.isActive());

        if (service.getCategory() != null) {
            res.setCategoryId(service.getCategory().getId());
            res.setCategoryName(service.getCategory().getName());
        }

        return res;
    }
}
