export type ProductItem = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
};

export type UserInfo = {
  name: string;
  phone: string;
  address: string;
};

export type CreateOrderBody = {
  products: ProductItem[];
  user: UserInfo;
  description?: string;
};
export interface IOrder {
  _id: string;
  userId: string;
  products: IOrderProduct[];
  user: IOrderUser;
  description?: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface IOrderProduct {
  _id: string;
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export interface IOrderUser {
  name: string;
  phone: string;
  address: string;
}
export type OrderListResponse = Order[];

export interface Order {
  _id: string;
  userId: OrderUserAccount;
  products: OrderProduct[];
  user: OrderShippingInfo;
  description?: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderUserAccount {
  _id: string;
  username: string;
  email: string;
}

export interface OrderProduct {
  _id: string;
  productId: ProductInfo;
  size: string;
  color: string;
  quantity: number;
}

export interface ProductInfo {
  _id: string;
  name: string;
  price: number;
  images: string[];
}

export interface OrderShippingInfo {
  name: string;
  phone: string;
  address: string;
}