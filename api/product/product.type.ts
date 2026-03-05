export interface GetProductQuery {
    name?: string;        // Tìm kiếm theo tên
    category?: string;    // Lọc theo category
    minPrice?: number;    // Giá tối thiểu
    maxPrice?: number;    // Giá tối đa
    onSale?: "true" | "false";  // Lọc sản phẩm đang sale
    pageNumber?: number;  // Số trang (mặc định: 1)
    pageSize?: number;    // Số sản phẩm/trang (mặc định: 10)
}

export interface ProductVariant {
    _id: string;
    color: string;
    size: string;
    stock: number;
    sold: number;
    price: number;
}

export interface Product {
    _id: string;
    name: string;
    description: string;
    category: string;
    sale: number | null; // % giảm giá, null nếu không sale
    variants: ProductVariant[];
    images: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

// Response cho API lấy danh sách sản phẩm
export interface GetProductResponse {
    count: number;         // Số sản phẩm trong trang hiện tại
    total: number;         // Tổng số sản phẩm khớp filter
    page: number;          // Trang hiện tại
    pageSize: number;      // Số sản phẩm/trang
    totalPages: number;    // Tổng số trang
    products: Product[];   // Danh sách sản phẩm
}

// Response cho API lấy chi tiết 1 sản phẩm
export interface GetDetailProductResponse {
    product: Product;
}
