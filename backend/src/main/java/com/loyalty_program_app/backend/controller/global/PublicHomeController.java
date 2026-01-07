package com.loyalty_program_app.backend.controller.global;

import com.loyalty_program_app.backend.dto.home.PublicHomeResponse;
import com.loyalty_program_app.backend.dto.service.ServiceResponse;
import com.loyalty_program_app.backend.dto.category.CategoryResponse;
import com.loyalty_program_app.backend.service.PublicHomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicHomeController {

    private final PublicHomeService homeService;

    /* ===============================
       Public Home (Landing Page)
       =============================== */
    @GetMapping("/home")
    public PublicHomeResponse getHome() {
        return homeService.getPublicHomeData();
    }

    /* ===============================
       Public Services
       =============================== */
    @GetMapping("/services")
    public List<ServiceResponse> getServices() {
        return homeService.getPublicServices();
    }

    /* ===============================
       Public Categories
       =============================== */
    @GetMapping("/categories")
    public List<CategoryResponse> getCategories() {
        return homeService.getPublicCategories();
    }
}
