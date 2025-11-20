package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.service.ServiceRequest;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.service.impl.AdminServiceServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/services")
@RequiredArgsConstructor
public class AdminServiceController {

    private final AdminServiceServiceImpl service;

    @GetMapping
    public List<ServiceResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ServiceResponse getOne(@PathVariable UUID id) {
        return service.getById(id);
    }

    @PostMapping
    public ServiceResponse create(@RequestBody ServiceRequest dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public ServiceResponse update(@PathVariable UUID id, @RequestBody ServiceRequest dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable UUID id) {
        service.delete(id);
        return "Service deleted";
    }
}
