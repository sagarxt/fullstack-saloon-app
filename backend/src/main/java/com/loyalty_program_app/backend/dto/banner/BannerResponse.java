package com.loyalty_program_app.backend.dto.banner;

import lombok.Data;

import java.util.UUID;

@Data
public class BannerResponse {
    private UUID id;
    private String title;
    private String image;
    private String redirectUrl;
    private Boolean active;
    private String createdAt;
}
