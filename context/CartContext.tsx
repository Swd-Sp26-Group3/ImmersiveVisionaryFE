"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  orderId: string;
  projectName: string;
  productType: string | null;
  deliverySpeed: string | null;
  budget: string | null;
  addedAt: string; // ISO timestamp
  status: "pending" | "submitted";
}

interface CartContextType {
  items: CartItem[];
  totalCount: number;
  addItem: (item: CartItem) => void;
  removeItem: (orderId: string) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

/** Returns the localStorage key scoped to the current user */
function cartKey(userId: string | undefined) {
  return userId ? `cart_${userId}` : "cart_guest";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage whenever user changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cartKey(user?.id));
      if (raw) {
        setItems(JSON.parse(raw) as CartItem[]);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  }, [user?.id]);

  // Persist cart to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(cartKey(user?.id), JSON.stringify(items));
    } catch {
      // quota exceeded — silent
    }
  }, [items, user?.id]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      // avoid duplicates by orderId
      if (prev.some((i) => i.orderId === item.orderId)) return prev;
      return [item, ...prev];
    });
  }, []);

  const removeItem = useCallback((orderId: string) => {
    setItems((prev) => prev.filter((i) => i.orderId !== orderId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount: items.length,
        addItem,
        removeItem,
        clearCart,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
