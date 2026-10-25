package com.groomish_now.backend.controller.global;

import com.groomish_now.backend.dto.home.PublicHomeResponse;
import com.groomish_now.backend.dto.service.ServiceResponse;
import com.groomish_now.backend.dto.category.CategoryResponse;
import com.groomish_now.backend.service.service.ServiceService;
import com.groomish_now.backend.service.global.PublicHomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicHomeController {

    private final PublicHomeService homeService;
    private final ServiceService serviceService;

    @GetMapping("/home")
    public PublicHomeResponse getHome() {
        return homeService.getPublicHomeData();
    }

    @GetMapping("/services")
    public List<ServiceResponse> getServices() {
        return homeService.getPublicServices();
    }

    @GetMapping("/services/{id}")
    public ServiceResponse getServiceById(@PathVariable java.util.UUID id) {
        return serviceService.getServiceById(id);
    }

    @GetMapping("/categories")
    public List<CategoryResponse> getCategories() {
        return homeService.getPublicCategories();
    }

    @GetMapping("/categories/{id}")
    public CategoryResponse getCategoryById(@PathVariable java.util.UUID id) {
        return homeService.getPublicCategories().stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }
}
