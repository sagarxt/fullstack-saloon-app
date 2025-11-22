package com.loyalty_program_app.backend.controller.staff;

import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.service.staff.StaffServiceBrowseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/services")
@RequiredArgsConstructor
public class StaffServiceController {

    private final StaffServiceBrowseService serviceBrowseService;

    @GetMapping
    public Page<ServiceResponse> listServices(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String gender,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return serviceBrowseService.listServices(search, categoryId, gender, pageable);
    }

    @GetMapping("/{id}")
    public ServiceResponse getService(@PathVariable UUID id) {
        return serviceBrowseService.getServiceById(id);
    }
}
