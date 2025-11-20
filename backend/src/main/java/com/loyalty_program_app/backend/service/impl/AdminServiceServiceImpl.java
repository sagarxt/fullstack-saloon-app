package com.loyalty_program_app.backend.service.impl;

import com.loyalty_program_app.backend.dto.service.ServiceRequest;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.model.ServiceEntity;
import com.loyalty_program_app.backend.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminServiceServiceImpl {

    private final ServiceRepository serviceRepo;

    public List<ServiceResponse> getAll() {
        return serviceRepo.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ServiceResponse getById(UUID id) {
        ServiceEntity service = serviceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        return toResponse(service);
    }

    public ServiceResponse create(ServiceRequest dto) {
        ServiceEntity s = ServiceEntity.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .mrp(dto.getMrp())                    // ✔ FIXED
                .price(dto.getPrice())
                .durationMinutes(dto.getDurationMinutes())
                .build();

        serviceRepo.save(s);
        return toResponse(s);
    }

    public ServiceResponse update(UUID id, ServiceRequest dto) {
        ServiceEntity s = serviceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        s.setName(dto.getName());
        s.setDescription(dto.getDescription());
        s.setMrp(dto.getMrp());                     // ✔ FIXED
        s.setPrice(dto.getPrice());
        s.setDurationMinutes(dto.getDurationMinutes());

        serviceRepo.save(s);
        return toResponse(s);
    }

    public void delete(UUID id) {
        if (!serviceRepo.existsById(id)) {
            throw new RuntimeException("Service not found");
        }
        serviceRepo.deleteById(id);
    }

    private ServiceResponse toResponse(ServiceEntity s) {
        return ServiceResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .mrp(s.getMrp())                     // ✔ FIXED
                .price(s.getPrice())
                .durationMinutes(s.getDurationMinutes())
                .build();
    }
}
