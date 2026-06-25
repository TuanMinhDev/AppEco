export interface SellerSummary {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface GetProductQuery {
  name?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  color?: string;
  size?: string;
  sellerId?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ProductVariant {
  _id?: string;
  color: string;
  size: string;
  stock: number;
  sold: number;
  price: number;
}

export type ProductViewSource = 'detail_page' | 'search' | 'recommend';

export interface RecordProductViewPayload {
  source?: ProductViewSource;
}

export interface RecordProductViewResponse {
  success: boolean;
  message: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  categoryId: string | { _id: string; name: string; description?: string };
  sellerId: string | SellerSummary;
  sale?: number | null;
  variants: ProductVariant[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GetProductResponse {
  count: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  products: Product[];
}

export interface GetDetailProductResponse {
  product: Product;
}

export interface CreateProductFormFields {
  name: string;
  description: string;
  category: string;
  sale?: number;
  variants: string;
}

export interface UpdateProductFormFields extends CreateProductFormFields {
  removeImages?: string;
}
