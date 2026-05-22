export interface CommentUserSummary {
  _id: string;
  name?: string;
  email?: string;
}

export interface Comment {
  _id: string;
  userId: CommentUserSummary | string;
  orderId: string;
  orderItemId?: string;
  productId: string;
  content: string;
  rating: number;
  img?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommentsByProductResponse {
  message: string;
  productId: string;
  comment: Comment[];
}

export interface CreateCommentBody {
  productId: string;
  orderId: string;
  orderItemId?: string;
  content: string;
  rating: number;
  img?: string;
}

export interface CreateCommentResponse {
  message: string;
  comment: Comment;
}

/** GET /comment/order/:orderId/reviewable-items */
export interface ReviewableLineItem {
  orderItemId: string;
  productId: string | { _id: string; [key: string]: unknown };
  variant: { color: string; size: string };
  quantity: number;
  price: number;
}

export interface ReviewableItemsResponse {
  message: string;
  orderId: string;
  reviewableItems: ReviewableLineItem[];
}
