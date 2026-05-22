/**
 * Types cho AI (gợi ý sản phẩm).
 */

export interface RecommendedProduct {
  _id: string;
  name: string;
  price: number;
  sale?: number | null;
  image?: string | null;
  seller_name?: string;
  score: number;
  reason: string;
}

export interface RecommendResponse {
  user_id?: string;
  products: RecommendedProduct[];
  algorithm: string;
}

/** GET /ai/health — NodeTS proxy tới Python AI */
export interface AiHealthResponse {
  nodeTS: string;
  pythonAI: unknown;
}
