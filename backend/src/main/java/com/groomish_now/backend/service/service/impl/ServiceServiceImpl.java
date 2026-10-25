package com.groomish_now.backend.service.service.impl;

import com.groomish_now.backend.dto.service.SubServiceDto;
import com.groomish_now.backend.dto.service.ServiceRequest;
import com.groomish_now.backend.dto.service.ServiceResponse;
import com.groomish_now.backend.enums.ServiceGender;
import com.groomish_now.backend.model.ServiceEntity;
import com.groomish_now.backend.repository.CategoryRepository;
import com.groomish_now.backend.repository.ServiceRepository;
import com.groomish_now.backend.service.service.ServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceServiceImpl implements ServiceService {

    private final ServiceRepository serviceRepository;
    private final CategoryRepository categoryRepository;

    /* ===============================
       ADMIN + CUSTOMER
       =============================== */

    @Override
    public List<ServiceResponse> getActiveServices() {
        return serviceRepository.findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
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

    @Override
    public ServiceResponse create(ServiceRequest request) {
        ServiceEntity service = new ServiceEntity();

        mapRequest(service, request);
        service.setActive(true);

        return toResponse(serviceRepository.save(service));
    }

    @Override
    public ServiceResponse update(UUID id, ServiceRequest request) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        mapRequest(service, request);

        return toResponse(serviceRepository.save(service));
    }

    @Override
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

        if (service.getSubServices() != null) {
            res.setSubServices(service.getSubServices().stream()
                    .map(sub -> SubServiceDto.builder()
                            .id(sub.getId())
                            .name(sub.getName())
                            .description(sub.getDescription())
                            .mrp(sub.getMrp())
                            .price(sub.getPrice())
                            .durationMinutes(sub.getDurationMinutes())
                            .active(sub.isActive())
                            .build())
                    .toList());
        }

        return res;
    }
}
