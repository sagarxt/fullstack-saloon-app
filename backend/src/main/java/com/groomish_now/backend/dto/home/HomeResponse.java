package com.groomish_now.backend.dto.home;

import com.groomish_now.backend.dto.banner.BannerResponse;
import com.groomish_now.backend.dto.category.CategoryResponse;
import com.groomish_now.backend.dto.service.ServiceResponse;
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
