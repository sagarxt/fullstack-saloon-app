package com.loyalty_program_app.backend.service.interfaces;

import com.loyalty_program_app.backend.dto.home.HomeResponse;

import java.util.UUID;

public interface CustomerHomeService {

    HomeResponse getHomeData(UUID userId);
}
