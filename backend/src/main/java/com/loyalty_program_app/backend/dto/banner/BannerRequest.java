package com.loyalty_program_app.backend.dto.banner;

import lombok.Data;

@Data
public class BannerRequest {

    private String title;
    private String redirectUrl;
    private Boolean active;

    // This will receive the Cloudinary URL after upload
    private String image;
}
