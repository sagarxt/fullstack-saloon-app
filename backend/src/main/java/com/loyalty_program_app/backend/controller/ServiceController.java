package com.loyalty_program_app.backend.controller;

import com.loyalty_program_app.backend.dto.service.ServiceRequest;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.service.ServiceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
public class ServiceController {

    private final ServiceService service;

    public ServiceController(ServiceService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<ServiceResponse>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody ServiceRequest dto) {
        return ResponseEntity.ok(service.create(dto));
    }
}
