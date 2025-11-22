package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.home.HomeResponse;
import com.loyalty_program_app.backend.service.interfaces.CustomerHomeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/home")
@RequiredArgsConstructor
public class CustomerHomeController {

    private final CustomerHomeService homeService;

    private UUID getCurrentUserId(HttpServletRequest request) {
        return UUID.fromString((String) request.getAttribute("userId"));
    }

    @GetMapping
    public HomeResponse getHome(HttpServletRequest request) {
        return homeService.getHomeData(getCurrentUserId(request));
    }
}
