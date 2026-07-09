"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { normalizePincode } from "@/lib/pincode";
import { shippingRateDescription } from "@/lib/shipping";

export type DeliveryType = "courier" | "post" | "in_person";
export type PaymentType = "cash" | "bank";
export type PincodeStatus = "idle" | "loading" | "valid" | "invalid";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  weight: number;
  is_quran?: boolean;
}

export interface PincodeInfo {
  state: string;
  district: string;
  isGujarat: boolean;
}

interface CartContextProps {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  updateQuantity: (id: number, quantity: number) => void;

  deliveryType: DeliveryType;
  setDeliveryType: (type: DeliveryType) => void;
  paymentType: PaymentType;
  setPaymentType: (type: PaymentType) => void;

  deliveryPincode: string;
  setDeliveryPincode: (pin: string) => void;
  pincodeStatus: PincodeStatus;
  pincodeInfo: PincodeInfo | null;
  lookupPincode: (pin: string) => Promise<void>;

  subtotal: number;
  discount: number;
  quranDiscount: number;
  percentageDiscount: number;
  packagingCharge: number;
  shippingDescription: string;
  total: number;
  totalWeightGrams: number;
  totalWeightKg: number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("courier");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [deliveryPincode, setDeliveryPincodeState] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<PincodeStatus>("idle");
  const [pincodeInfo, setPincodeInfo] = useState<PincodeInfo | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsed: CartItem[] = JSON.parse(savedCart);
      setCart(parsed.map((i) => ({ ...i, weight: i.weight ?? 80, is_quran: i.is_quran ?? false })));
    }

    const savedPin = localStorage.getItem("deliveryPincode");
    if (savedPin) setDeliveryPincodeState(savedPin);
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (deliveryPincode) {
      localStorage.setItem("deliveryPincode", deliveryPincode);
    } else {
      localStorage.removeItem("deliveryPincode");
    }
  }, [deliveryPincode]);

  const lookupPincode = useCallback(async (raw: string) => {
    const pin = normalizePincode(raw);
    setDeliveryPincodeState(pin);

    if (pin.length !== 6) {
      setPincodeStatus("idle");
      setPincodeInfo(null);
      return;
    }

    setPincodeStatus("loading");
    try {
      const res = await fetch(`/api/pincode/${pin}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setPincodeInfo({
          state: data.state,
          district: data.district,
          isGujarat: data.isGujarat,
        });
        setPincodeStatus("valid");
      } else {
        setPincodeInfo(null);
        setPincodeStatus("invalid");
      }
    } catch {
      setPincodeInfo(null);
      setPincodeStatus("invalid");
    }
  }, []);

  const setDeliveryPincode = useCallback(
    (raw: string) => {
      const pin = normalizePincode(raw);
      setDeliveryPincodeState(pin);
      if (pin.length === 6) {
        void lookupPincode(pin);
      } else {
        setPincodeStatus("idle");
        setPincodeInfo(null);
      }
    },
    [lookupPincode]
  );

  useEffect(() => {
    if (deliveryPincode.length === 6 && pincodeStatus === "idle") {
      void lookupPincode(deliveryPincode);
    }
  }, [deliveryPincode, pincodeStatus, lookupPincode]);

  const addToCart = (item: CartItem) => {
    const amount = Math.max(1, item.quantity);
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + amount }
            : cartItem
        );
      }

      return [...prevCart, { ...item, quantity: amount }];
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const QURAN_FLAT_DISCOUNT_PER_COPY = 25;
  const quranSubtotal = cart.reduce(
    (sum, item) => (item.is_quran ? sum + item.price * item.quantity : sum),
    0
  );
  const nonQuranSubtotal = subtotal - quranSubtotal;
  const quranQty = cart.reduce(
    (sum, item) => (item.is_quran ? sum + item.quantity : sum),
    0
  );

  const totalWeightGrams = cart.reduce(
    (sum, item) => sum + (item.weight ?? 80) * item.quantity,
    0
  );
  const totalWeightKg = totalWeightGrams / 1000;

  const isGujaratForShipping =
    deliveryType === "in_person"
      ? null
      : pincodeStatus === "valid" && pincodeInfo
        ? pincodeInfo.isGujarat
        : null;

  // Shipping/packaging is confirmed by phone call — not charged at checkout
  const packagingCharge = 0;

  const shippingDescription = shippingRateDescription(
    deliveryType,
    isGujaratForShipping,
    totalWeightGrams
  );

  const quranDiscount = Math.min(quranSubtotal, quranQty * QURAN_FLAT_DISCOUNT_PER_COPY);

  let percentageDiscount = 0;
  if (subtotal >= 5000 && nonQuranSubtotal > 0) {
    if (paymentType === "bank") {
      percentageDiscount = nonQuranSubtotal * 0.10;
    } else if (paymentType === "cash") {
      percentageDiscount = nonQuranSubtotal * 0.15;
    }
  }

  const discount = quranDiscount + percentageDiscount;
  const total = Math.max(0, subtotal - discount);

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
        deliveryPincode,
        setDeliveryPincode,
        pincodeStatus,
        pincodeInfo,
        lookupPincode,
        subtotal,
        discount,
        quranDiscount,
        percentageDiscount,
        packagingCharge,
        shippingDescription,
        total,
        totalWeightGrams,
        totalWeightKg,
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
