import type { Product } from "@/api/product/product.type";

export interface CartLineVariant {
  color: string;
  size: string;
}

export interface CartLineInput {
  productId: string;
  variant: CartLineVariant;
  quantity: number;
}

export interface AddToCartPayload {
  items: CartLineInput[];
}

/** Khi API populate `productId` — cùng shape với document product + field phụ Mongo/API */
export type CartProductPopulated = Product & {
  isActive?: boolean;
  __v?: number;
};

export type CartItem = {
  _id: string;
  productId: string | CartProductPopulated;
  variant: CartLineVariant;
  quantity: number;
  price: number;
};

export type Cart = {
  _id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
  status: "active" | string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type GetCartResponse = {
  message: string;
  cart: Cart;
};

export type UpdateCartQuantityPayload = {
  quantity: number;
};

export type DeleteCartItemsPayload = {
  itemIds: string[];
};

export type AddToCartResponse = {
  message: string;
  cart: Cart;
};

export type DeleteCartResponse = {
  message: string;
  cart: Cart;
};

export type UpdateCartResponse = {
  message: string;
  cart: Cart;
};

export interface ICart {
  _id: string;
  productId: {
    _id: string;
    name: string;
    description: string;
    categoryId: string;
    sellerId: string;
    sale: number | null;
    variants: {
      color: string;
      size: string;
      stock: number;
      sold: number;
      price: number;
    }[];
    images: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  variant: {
    color: string;
    size: string;
  };
  quantity: number;
  price: number;
}
