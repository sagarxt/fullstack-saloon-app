package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.service.ServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
public class CustomerServiceController {

    private final ServiceService serviceService;

    /* ===============================
       Get all active services
       =============================== */
    @GetMapping
    public List<ServiceResponse> getAllServices() {
        return serviceService.getActiveServices();
    }

    /* ===============================
       Get service by ID
       =============================== */
    @GetMapping("/{id}")
    public ServiceResponse getServiceById(@PathVariable UUID id) {
        return serviceService.getServiceById(id);
    }
}
