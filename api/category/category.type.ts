export interface Category {
  _id: string;
  name: string;
  description?: string;
}

export interface CategoryDetailResponse {
  message: string;
  category: Category;
}

export interface CreateCategoryResponse {
  message: string;
  category: Category;
}

export interface UpdateCategoryResponse {
  message: string;
  category: Category;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
}
