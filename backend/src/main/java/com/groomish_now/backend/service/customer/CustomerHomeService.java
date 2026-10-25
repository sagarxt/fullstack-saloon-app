package com.groomish_now.backend.service.customer;

import com.groomish_now.backend.dto.home.HomeResponse;

import java.util.UUID;

public interface CustomerHomeService {

    HomeResponse getHomeData(UUID userId);
}
