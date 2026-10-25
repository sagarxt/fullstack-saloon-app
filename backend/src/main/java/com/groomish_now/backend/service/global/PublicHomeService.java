package com.groomish_now.backend.service.global;

import com.groomish_now.backend.dto.category.CategoryResponse;
import com.groomish_now.backend.dto.home.PublicHomeResponse;
import com.groomish_now.backend.dto.service.ServiceResponse;

import java.util.List;

public interface PublicHomeService {

    PublicHomeResponse getPublicHomeData();

    List<ServiceResponse> getPublicServices();

    List<CategoryResponse> getPublicCategories();
}
