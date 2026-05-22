import type { Product } from '@/api/product/product.type';

export interface FavoritesListResponse {
  message: string;
  favorites: Product[];
}

export interface AddFavoriteResponse {
  message: string;
}

export interface RemoveFavoriteResponse {
  message: string;
}
