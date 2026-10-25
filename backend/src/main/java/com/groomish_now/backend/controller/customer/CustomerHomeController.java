package com.groomish_now.backend.controller.customer;

import com.groomish_now.backend.dto.home.HomeResponse;
import com.groomish_now.backend.service.customer.CustomerHomeService;
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
