package com.loyalty_program_app.backend.service.product;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.product.AddProductToBookingRequest;
import com.loyalty_program_app.backend.dto.product.ProductRequest;
import com.loyalty_program_app.backend.dto.product.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ProductService {

    List<ProductResponse> getAllActiveProducts();

    Page<ProductResponse> getAllProducts(Pageable pageable);

    ProductResponse getProductById(UUID id);

    List<ProductResponse> getProductsByCategory(String category);

    List<ProductResponse> searchProducts(String query);

    List<String> getProductCategories();

    ProductResponse createProduct(ProductRequest request);

    ProductResponse updateProduct(UUID id, ProductRequest request);

    void deleteProduct(UUID id);

    BookingResponse addProductToBooking(UUID bookingId, AddProductToBookingRequest request);

    BookingResponse removeProductFromBooking(UUID bookingId, UUID bookingProductId);

    BookingResponse completeBookingAndSendBill(UUID bookingId);
}
