package com.groomish_now.backend.service.staff;

import com.groomish_now.backend.dto.service.ServiceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StaffServiceBrowseService {

    Page<ServiceResponse> listServices(String search, UUID categoryId, String gender, Pageable pageable);

    ServiceResponse getServiceById(UUID id);
}
