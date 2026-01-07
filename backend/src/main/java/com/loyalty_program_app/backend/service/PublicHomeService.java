package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.dto.category.CategoryResponse;
import com.loyalty_program_app.backend.dto.home.PublicHomeResponse;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;

import java.util.List;

public interface PublicHomeService {

    PublicHomeResponse getPublicHomeData();

    List<ServiceResponse> getPublicServices();

    List<CategoryResponse> getPublicCategories();
}
