export interface User {
  _id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetMeResponse {
  _id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  avatar?: string;
  /** Backend có thể trả về khi đã từng cập nhật qua update-info */
  address?: string;
  createdAt: string;
  updatedAt: string;
}

/** Khớp PUT /user/update-info */
export interface UpdateUserInfoPayload {
  name: string;
  email: string;
  address: string;
  phoneNumber: string;
}

export interface UpdateUserInfoResponse {
  message: string;
}

/** GET /user/all — mảng user (admin) */
export type AdminUserListItem = GetMeResponse;

export interface SellerWarehousePublic {
  province: string;
  ward: string;
  /** Optional — tương thích dữ liệu cũ */
  district?: string;
}

export interface SellerPublicShop {
  sellerId: string;
  shopName: string;
  warehouse: SellerWarehousePublic | null;
}

export interface RecentViewItem {
  productId: string;
  viewedAt: string;
  source: string;
  product: {
    _id: string;
    name: string;
    images: string[];
    sale?: number | null;
    variants: Array<{
      color?: string;
      size?: string;
      price?: number;
      stock?: number;
      sold?: number;
    }>;
    categoryId?: string | { _id: string; name?: string };
    sellerId?: string | { _id: string; name?: string };
    description?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface RecentViewsResponse {
  success: boolean;
  message: string;
  items: RecentViewItem[];
  totalItems: number;
}
