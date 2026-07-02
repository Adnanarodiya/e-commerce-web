"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type DeliveryType = "courier" | "post" | "in_person";
export type PaymentType = "cash" | "bank";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  weight: number;
}

interface CartContextProps {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  updateQuantity: (id: number, quantity: number) => void;

  // Custom checkout values
  deliveryType: DeliveryType;
  setDeliveryType: (type: DeliveryType) => void;
  paymentType: PaymentType;
  setPaymentType: (type: PaymentType) => void;
  subtotal: number;
  discount: number;
  packagingCharge: number;
  total: number;
  totalWeightGrams: number;
  totalWeightKg: number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("courier");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      // Normalize legacy items that have no weight (default 80g)
      const parsed: CartItem[] = JSON.parse(savedCart);
      setCart(parsed.map((i) => ({ ...i, weight: i.weight ?? 80 })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...prevCart, item];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const updateQuantity = (id: number, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  // 1. Calculate subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 2. Calculate total weight (grams) from book weights x quantities
  const totalWeightGrams = cart.reduce(
    (sum, item) => sum + (item.weight ?? 80) * item.quantity,
    0
  );
  const totalWeightKg = totalWeightGrams / 1000;

  // 3. Weight-based packaging: ₹10 per kg, rounded up to the next whole kg.
  //    In Person pickup = ₹0. (1 kg = ₹10, 10 kg = ₹100)
  let packagingCharge = 0;
  if (deliveryType !== "in_person" && totalWeightGrams > 0) {
    const chargeableKg = Math.ceil(totalWeightGrams / 1000);
    packagingCharge = chargeableKg * 10;
  }

  // 4. Calculate tiered payment discounts (if subtotal is 5K or more)
  let discount = 0;
  if (subtotal >= 5000) {
    if (paymentType === "bank") {
      discount = subtotal * 0.10; // 10%
    } else if (paymentType === "cash") {
      discount = subtotal * 0.15; // 15%
    }
  }

  // 5. Calculate final total
  const total = Math.max(0, subtotal - discount + packagingCharge);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
        deliveryType,
        setDeliveryType,
        paymentType,
        setPaymentType,
        subtotal,
        discount,
        packagingCharge,
        total,
        totalWeightGrams,
        totalWeightKg
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
