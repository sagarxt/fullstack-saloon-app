import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customerApi } from '../api/client';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string | number;
  itemType: 'SERVICE' | 'PRODUCT';
  serviceId?: string | number;
  productId?: string | number;
  name: string;
  price: number;
  unitPrice?: number;
  mrp?: number;
  subServiceMrp?: number;
  serviceMrp?: number;
  productMrp?: number;
  quantity: number;
  image?: string;
  durationMinutes?: number;
  subServiceName?: string;
  subServicePrice?: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<void>;
  removeItem: (id: string | number) => Promise<void>;
  updateQuantity: (id: string | number, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isItemInCart: (type: 'SERVICE' | 'PRODUCT', targetId: string | number) => boolean;
  getItemCountForId: (type: 'SERVICE' | 'PRODUCT', targetId: string | number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = '@groomish_mobile_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadLocalCart();
  }, []);

  const loadLocalCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (_) {}
  };

  const saveCart = async (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (_) {}
  };

  const addItem = async (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qtyToAdd = item.quantity || 1;
    const existingIndex = items.findIndex((i) => {
      if (item.itemType === 'SERVICE') {
        const targetId = item.serviceId || item.id;
        const currentTargetId = i.serviceId || i.id;
        return (
          i.itemType === 'SERVICE' &&
          String(currentTargetId) === String(targetId) &&
          i.subServiceName === item.subServiceName
        );
      } else {
        const targetId = item.productId || item.id;
        const currentTargetId = i.productId || i.id;
        return i.itemType === 'PRODUCT' && String(currentTargetId) === String(targetId);
      }
    });

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...items];
      updated[existingIndex].quantity += qtyToAdd;
    } else {
      updated = [
        ...items,
        {
          ...item,
          quantity: qtyToAdd,
        },
      ];
    }
    await saveCart(updated);

    // If authenticated, also sync with backend cart API
    if (isAuthenticated) {
      try {
        await customerApi.addToCart({
          itemType: item.itemType,
          serviceId: item.serviceId || (item.itemType === 'SERVICE' ? item.id : undefined),
          productId: item.productId || (item.itemType === 'PRODUCT' ? item.id : undefined),
          quantity: qtyToAdd,
          subServiceName: item.subServiceName,
          subServicePrice: item.subServicePrice,
        });
      } catch (err) {
        console.warn('Backend cart sync note:', err);
      }
    }
  };

  const updateQuantity = async (id: string | number, delta: number) => {
    const updated = items
      .map((item) => {
        if (String(item.id) === String(id)) {
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    await saveCart(updated);
  };

  const removeItem = async (id: string | number) => {
    const updated = items.filter((item) => String(item.id) !== String(id));
    await saveCart(updated);
  };

  const clearCart = async () => {
    await saveCart([]);
    if (isAuthenticated) {
      try {
        await customerApi.clearCart();
      } catch (_) {}
    }
  };

  const isItemInCart = (type: 'SERVICE' | 'PRODUCT', targetId: string | number) => {
    return items.some((i) => {
      if (type === 'SERVICE') {
        return (
          i.itemType === 'SERVICE' &&
          (String(i.serviceId) === String(targetId) || String(i.id) === String(targetId))
        );
      }
      return (
        i.itemType === 'PRODUCT' &&
        (String(i.productId) === String(targetId) || String(i.id) === String(targetId))
      );
    });
  };

  const getItemCountForId = (type: 'SERVICE' | 'PRODUCT', targetId: string | number) => {
    return items
      .filter((i) => {
        if (type === 'SERVICE') {
          return (
            i.itemType === 'SERVICE' &&
            (String(i.serviceId) === String(targetId) || String(i.id) === String(targetId))
          );
        }
        return (
          i.itemType === 'PRODUCT' &&
          (String(i.productId) === String(targetId) || String(i.id) === String(targetId))
        );
      })
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce(
    (sum, i) => sum + (i.subServicePrice || i.price) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalAmount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isItemInCart,
        getItemCountForId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
