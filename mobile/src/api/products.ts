import { apiFetch } from "./client";
import type { Product } from "./types";

export function listProducts() {
  return apiFetch<{ products: Product[] }>("/products");
}

export function getProductByBarcode(code: string) {
  return apiFetch<{ product: Product }>(`/products/barcode/${encodeURIComponent(code)}`);
}

export function createProduct(data: {
  name: string;
  barcode: string;
  costPrice: number;
  sellPrice: number;
  category?: string;
}) {
  return apiFetch<{ product: Product }>("/products", { method: "POST", body: data });
}

export function updateProduct(
  id: number,
  data: Partial<{ name: string; costPrice: number; sellPrice: number; category: string | null }>
) {
  return apiFetch<{ product: Product }>(`/products/${id}`, { method: "PATCH", body: data });
}
