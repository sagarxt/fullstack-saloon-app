package com.loyalty_program_app.backend.controller.global;

import com.loyalty_program_app.backend.dto.home.PublicHomeResponse;
import com.loyalty_program_app.backend.service.PublicHomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/home")
@RequiredArgsConstructor
public class PublicHomeController {

    private final PublicHomeService homeService;

    @GetMapping
    public PublicHomeResponse getHome() {
        return homeService.getPublicHomeData();
    }
}
