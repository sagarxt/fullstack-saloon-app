package com.groomish_now.backend.controller.admin;

import com.groomish_now.backend.dto.cart.AddToCartRequest;
import com.groomish_now.backend.dto.cart.CartResponse;
import com.groomish_now.backend.dto.cart.UpdateCartItemRequest;
import com.groomish_now.backend.service.cart.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/carts")
@RequiredArgsConstructor
public class AdminCartController {

    private final CartService cartService;

    @GetMapping("/user/{userId}")
    public CartResponse getCartForUser(@PathVariable UUID userId) {
        return cartService.getCartForUser(userId);
    }

    @PostMapping("/user/{userId}/items")
    public CartResponse addItemForUser(
            @PathVariable UUID userId,
            @RequestBody AddToCartRequest request
    ) {
        return cartService.addItemForUser(userId, request);
    }

    @PutMapping("/user/{userId}/items/{itemId}")
    public CartResponse updateItemForUser(
            @PathVariable UUID userId,
            @PathVariable UUID itemId,
            @RequestBody UpdateCartItemRequest request
    ) {
        return cartService.updateItemForUser(userId, itemId, request);
    }

    @DeleteMapping("/user/{userId}/items/{itemId}")
    public CartResponse removeItemForUser(
            @PathVariable UUID userId,
            @PathVariable UUID itemId
    ) {
        return cartService.removeItemForUser(userId, itemId);
    }

    @DeleteMapping("/user/{userId}")
    public CartResponse clearCartForUser(@PathVariable UUID userId) {
        return cartService.clearCartForUser(userId);
    }
}
