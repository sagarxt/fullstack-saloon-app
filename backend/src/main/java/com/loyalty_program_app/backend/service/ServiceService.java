package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.dto.service.ServiceRequest;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.model.ServiceEntity;
import com.loyalty_program_app.backend.repository.ServiceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServiceService {

    private final ServiceRepository repo;

    public ServiceService(ServiceRepository repo) {
        this.repo = repo;
    }

    public ServiceResponse create(ServiceRequest dto) {
        ServiceEntity e = ServiceEntity.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .durationMinutes(dto.getDurationMinutes())
                .build();
        ServiceEntity saved = repo.save(e);
        return toDto(saved);
    }

    public List<ServiceResponse> listAll() {
        return repo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public ServiceResponse toDto(ServiceEntity e) {
        ServiceResponse r = new ServiceResponse();
        r.setId(e.getId());
        r.setName(e.getName());
        r.setDescription(e.getDescription());
        r.setPrice(e.getPrice());
        r.setDurationMinutes(e.getDurationMinutes());
        return r;
    }
}
