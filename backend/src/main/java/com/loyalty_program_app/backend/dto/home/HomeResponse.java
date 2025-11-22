package com.loyalty_program_app.backend.dto.home;

import com.loyalty_program_app.backend.dto.banner.BannerResponse;
import com.loyalty_program_app.backend.dto.category.CategoryResponse;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import lombok.Data;

import java.util.List;

@Data
public class HomeResponse {

    private List<BannerResponse> banners;
    private List<CategoryResponse> categories;
    private List<ServiceResponse> popularServices;

    // NEW — Personalized block
    private List<ServiceResponse> personalizedServices;

    private Integer points;
    private String tier;
}
