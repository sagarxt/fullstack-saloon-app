package com.groomish_now.backend.service.service;

import com.groomish_now.backend.dto.service.ServiceRequest;
import com.groomish_now.backend.dto.service.ServiceResponse;

import java.util.List;
import java.util.UUID;

public interface ServiceService {

    List<ServiceResponse> getActiveServices();

    ServiceResponse getServiceById(UUID id);

    ServiceResponse create(ServiceRequest request);

    ServiceResponse update(UUID id, ServiceRequest request);

    void delete(UUID id);
}
