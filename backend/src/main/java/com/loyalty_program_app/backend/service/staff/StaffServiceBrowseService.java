package com.loyalty_program_app.backend.service.staff;

import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StaffServiceBrowseService {

    Page<ServiceResponse> listServices(String search, UUID categoryId, String gender, Pageable pageable);

    ServiceResponse getServiceById(UUID id);
}
