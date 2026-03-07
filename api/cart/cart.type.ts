export interface PayloadCart {
    productId: string;
    variant: {
        color: string;
        size: string;
    };
    quantity: number;

}
export type CartItem = {
  _id: string;
  productId: {
    _id: string;
    name: string;
    category: string;
    sale?: number;
    images?: string[];
  };
  variant: {
    color: string;
    size: string;
  };
  quantity: number;
  price: number;
};

export type Cart = {
  _id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type GetCartResponse = {
  message: string;
  cart: Cart;
};

export type UpdateQuatity = {
  quantity: number;
};
export type DeleteCart = {
  itemIds: string[];
};
