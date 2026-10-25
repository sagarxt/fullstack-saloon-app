package com.groomish_now.backend.controller.staff;

import com.groomish_now.backend.dto.booking.BookingResponse;
import com.groomish_now.backend.dto.product.AddProductToBookingRequest;
import com.groomish_now.backend.dto.product.ProductResponse;
import com.groomish_now.backend.service.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/products")
@RequiredArgsConstructor
public class StaffProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductResponse> getActiveProductsForStaff() {
        return productService.getAllActiveProducts();
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
