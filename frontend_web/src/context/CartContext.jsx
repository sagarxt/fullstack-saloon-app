import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./ToastProvider";
import {
  getMyCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  clearCart as apiClearCart,
  setCartStore as apiSetCartStore,
  checkoutCart as apiCheckoutCart,
} from "../api/cart";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const isCustomer = user && (user.role || "").replace("ROLE_", "") === "CUSTOMER";

  const fetchCart = useCallback(async () => {
    if (!isCustomer) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const res = await getMyCart();
      setCart(res.data || null);
    } catch (err) {
      console.error("Failed to load customer cart from DB", err);
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  useEffect(() => {
    if (isCustomer) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [isCustomer, fetchCart]);

  const addItem = async ({ itemType, serviceId, productId, quantity = 1, customNotes = null, storeId = null, name = "Item" }) => {
    if (!user) {
      showToast("Please sign in to add items to your cart", "info");
      return false;
    }
    if (!isCustomer) {
      showToast("Staff/Admin accounts cannot use customer cart", "warning");
      return false;
    }

    try {
      setLoading(true);
      const res = await apiAddToCart({
        itemType,
        serviceId,
        productId,
        quantity,
        customNotes,
        storeId,
      });
      setCart(res.data);
      showToast(`Added ${name} to your cart`, "success");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to add to cart";
      showToast(msg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity, customNotes = null) => {
    try {
      const res = await apiUpdateCartItem(itemId, { quantity, customNotes });
      setCart(res.data);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update item quantity";
      showToast(msg, "error");
      return false;
    }
  };

  const removeItem = async (itemId, name = "Item") => {
    try {
      const res = await apiRemoveCartItem(itemId);
      setCart(res.data);
      showToast(`Removed ${name} from cart`, "info");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to remove item";
      showToast(msg, "error");
      return false;
    }
  };

  const clearCart = async () => {
    try {
      const res = await apiClearCart();
      setCart(res.data);
      showToast("Cart cleared", "info");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to clear cart";
      showToast(msg, "error");
      return false;
    }
  };

  const updateStore = async (storeId) => {
    try {
      const res = await apiSetCartStore(storeId);
      setCart(res.data);
      return true;
    } catch (err) {
      console.error("Failed to update store for cart", err);
      return false;
    }
  };

  const checkout = async (checkoutData) => {
    try {
      setLoading(true);
      const res = await apiCheckoutCart(checkoutData);
      // Cart is cleared in DB, refresh local cart
      await fetchCart();
      showToast("Appointment & order confirmed successfully!", "success");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Checkout failed";
      showToast(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cartCount = cart?.totalItemCount ?? 0;
  const items = cart?.items ?? [];
  const servicesCount = cart?.servicesCount ?? 0;
  const productsCount = cart?.productsCount ?? 0;
  const totalAmount = cart?.totalAmount ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartCount,
        items,
        servicesCount,
        productsCount,
        totalAmount,
        fetchCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        updateStore,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
