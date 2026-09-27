export type Role = "owner" | "seller";

export interface AuthUser {
  id: number;
  name: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  business?: { id: number; name: string };
}

export interface Product {
  id: number;
  businessId: number;
  name: string;
  barcode: string;
  costPrice: string;
  sellPrice: string;
  currentStock: number;
  category: string | null;
  createdAt: string;
}

export interface Seller {
  id: number;
  name: string;
  phone: string;
  createdAt?: string;
}

export interface Sale {
  id: number;
  businessId: number;
  productId: number;
  sellerId: number;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  createdAt: string;
}

export interface ReportSummary {
  totalInvestment: number;
  totalSales: number;
  costOfGoodsSold: number;
  profit: number;
  currentStockValue: number;
  perSeller: { sellerId: number; sellerName: string; totalSales: number; saleCount: number }[];
}
