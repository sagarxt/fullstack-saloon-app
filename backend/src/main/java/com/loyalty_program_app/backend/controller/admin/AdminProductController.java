package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.product.AddProductToBookingRequest;
import com.loyalty_program_app.backend.dto.product.ProductRequest;
import com.loyalty_program_app.backend.dto.product.ProductResponse;
import com.loyalty_program_app.backend.service.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @GetMapping
    public Page<ProductResponse> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return productService.getAllProducts(pageable);
    }

    @GetMapping("/{id}")
    public ProductResponse getProductById(@PathVariable UUID id) {
        return productService.getProductById(id);
    }

    @PostMapping
    public ProductResponse createProduct(@RequestBody ProductRequest request) {
        return productService.createProduct(request);
    }

    @PutMapping("/{id}")
    public ProductResponse updateProduct(@PathVariable UUID id, @RequestBody ProductRequest request) {
        return productService.updateProduct(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
    }

    @PostMapping("/booking/{bookingId}/add")
    public BookingResponse addProductToBooking(
            @PathVariable UUID bookingId,
            @RequestBody AddProductToBookingRequest request
    ) {
        return productService.addProductToBooking(bookingId, request);
    }

    @DeleteMapping("/booking/{bookingId}/item/{bookingProductId}")
    public BookingResponse removeProductFromBooking(
            @PathVariable UUID bookingId,
            @PathVariable UUID bookingProductId
    ) {
        return productService.removeProductFromBooking(bookingId, bookingProductId);
    }

    @PostMapping("/booking/{bookingId}/complete-and-bill")
    public BookingResponse completeBookingAndSendBill(@PathVariable UUID bookingId) {
        return productService.completeBookingAndSendBill(bookingId);
    }
}
