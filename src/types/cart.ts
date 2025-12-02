// Unified cart system for DXF and Tube items

import { DxfConfig } from "./dxf";
import { TubeConfig, calculateTubePrice } from "@/types/igs";

export type CartItemType = "dxf" | "tube";

export interface CartItem {
  id: string;
  type: CartItemType;
  sequenceNumber: number; // 1, 2, 3, etc.
  typeSequenceNumber: number; // DXF-001, Tube-001
  dxfConfig?: DxfConfig;
  tubeConfig?: TubeConfig;
  createdAt: Date;
}

export interface Cart {
  items: CartItem[];
  nextSequenceNumber: number;
  nextDxfNumber: number;
  nextTubeNumber: number;
}

export const createEmptyCart = (): Cart => ({
  items: [],
  nextSequenceNumber: 1,
  nextDxfNumber: 1,
  nextTubeNumber: 1,
});

export const loadCartFromStorage = (): Cart => {
  const saved = localStorage.getItem("unified-cart");
  if (saved) {
    const parsed = JSON.parse(saved);
    // Convert date strings back to Date objects
    parsed.items = parsed.items.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));
    return parsed;
  }
  return createEmptyCart();
};

export const saveCartToStorage = (cart: Cart) => {
  localStorage.setItem("unified-cart", JSON.stringify(cart));
};

export const addDxfItemToCart = (cart: Cart, config: DxfConfig): Cart => {
  const newItem: CartItem = {
    id: `DXF-${String(cart.nextDxfNumber).padStart(3, "0")}`,
    type: "dxf",
    sequenceNumber: cart.nextSequenceNumber,
    typeSequenceNumber: cart.nextDxfNumber,
    dxfConfig: config,
    createdAt: new Date(),
  };

  return {
    items: [...cart.items, newItem],
    nextSequenceNumber: cart.nextSequenceNumber + 1,
    nextDxfNumber: cart.nextDxfNumber + 1,
    nextTubeNumber: cart.nextTubeNumber,
  };
};

export const addTubeItemToCart = (cart: Cart, config: TubeConfig): Cart => {
  const newItem: CartItem = {
    id: `Tube-${String(cart.nextTubeNumber).padStart(3, "0")}`,
    type: "tube",
    sequenceNumber: cart.nextSequenceNumber,
    typeSequenceNumber: cart.nextTubeNumber,
    tubeConfig: config,
    createdAt: new Date(),
  };

  return {
    items: [...cart.items, newItem],
    nextSequenceNumber: cart.nextSequenceNumber + 1,
    nextDxfNumber: cart.nextDxfNumber,
    nextTubeNumber: cart.nextTubeNumber + 1,
  };
};

export const removeItemFromCart = (cart: Cart, itemId: string): Cart => {
  return {
    ...cart,
    items: cart.items.filter((item) => item.id !== itemId),
  };
};

export const getCartTotalPrice = (cart: Cart): number => {
  return cart.items.reduce((sum, item) => {
    if (item.type === "dxf" && item.dxfConfig) {
      return sum + item.dxfConfig.price;
    }
    if (item.type === "tube" && item.tubeConfig) {
      return sum + calculateTubePrice(item.tubeConfig);
    }
    return sum;
  }, 0);
};
