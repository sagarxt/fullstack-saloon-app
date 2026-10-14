package com.loyalty_program_app.backend.service;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.cart.*;

import java.util.UUID;

public interface CartService {
    CartResponse getOrCreateCart(UUID userId);
    CartResponse addToCart(UUID userId, AddToCartRequest request);
    CartResponse updateCartItem(UUID userId, UUID itemId, UpdateCartItemRequest request);
    CartResponse removeCartItem(UUID userId, UUID itemId);
    CartResponse clearCart(UUID userId);
    CartResponse setStore(UUID userId, UUID storeId);

    // Staff & Admin user-specific cart management
    CartResponse getCartForUser(UUID userId);
    CartResponse addItemForUser(UUID userId, AddToCartRequest request);
    CartResponse updateItemForUser(UUID userId, UUID itemId, UpdateCartItemRequest request);
    CartResponse removeItemForUser(UUID userId, UUID itemId);
    CartResponse clearCartForUser(UUID userId);

    // Checkout
    BookingResponse checkoutCart(UUID userId, CartCheckoutRequest request);
}
