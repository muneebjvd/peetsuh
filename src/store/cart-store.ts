// ============================================================
// peetsuh — Zustand Cart Store
// Client-side only — persists across page navigation
// ============================================================
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/validation";

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string, size?: string) => void;
  updateQuantity: (itemId: string, size: string | undefined, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

function itemKey(itemId: string, size?: string): string {
  return `${itemId}::${size ?? "none"}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        set((state) => {
          const key = itemKey(item.itemId, item.size);
          const existing = state.items.find(
            (i) => itemKey(i.itemId, i.size) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i.itemId, i.size) === key
                  ? {
                      ...i,
                      quantity: i.quantity + item.quantity,
                      subtotal: (i.quantity + item.quantity) * i.unitPrice,
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },

      removeItem: (itemId: string, size?: string) => {
        set((state) => ({
          items: state.items.filter(
            (i) => itemKey(i.itemId, i.size) !== itemKey(itemId, size)
          ),
        }));
      },

      updateQuantity: (itemId: string, size: string | undefined, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId, size);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i.itemId, i.size) === itemKey(itemId, size)
              ? { ...i, quantity, subtotal: quantity * i.unitPrice }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "peetsuh-cart",
    }
  )
);
