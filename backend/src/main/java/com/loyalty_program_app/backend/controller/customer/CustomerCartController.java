package com.loyalty_program_app.backend.controller.customer;

import com.loyalty_program_app.backend.dto.booking.BookingResponse;
import com.loyalty_program_app.backend.dto.cart.*;
import com.loyalty_program_app.backend.security.CustomUserDetails;
import com.loyalty_program_app.backend.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/cart")
@RequiredArgsConstructor
public class CustomerCartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse getMyCart(@AuthenticationPrincipal CustomUserDetails user) {
        return cartService.getOrCreateCart(user.getId());
    }

    @PostMapping("/items")
    public CartResponse addToCart(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody AddToCartRequest request
    ) {
        return cartService.addToCart(user.getId(), request);
    }

    @PutMapping("/items/{itemId}")
    public CartResponse updateCartItem(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID itemId,
            @RequestBody UpdateCartItemRequest request
    ) {
        return cartService.updateCartItem(user.getId(), itemId, request);
    }

    @DeleteMapping("/items/{itemId}")
    public CartResponse removeCartItem(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID itemId
    ) {
        return cartService.removeCartItem(user.getId(), itemId);
    }

    @DeleteMapping
    public CartResponse clearCart(@AuthenticationPrincipal CustomUserDetails user) {
        return cartService.clearCart(user.getId());
    }

    @PutMapping("/store/{storeId}")
    public CartResponse setStore(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID storeId
    ) {
        return cartService.setStore(user.getId(), storeId);
    }

    @PostMapping("/checkout")
    public BookingResponse checkoutCart(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody CartCheckoutRequest request
    ) {
        return cartService.checkoutCart(user.getId(), request);
    }
}
