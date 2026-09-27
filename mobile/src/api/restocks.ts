import { apiFetch } from "./client";
import type { Product } from "./types";

interface Restock {
  id: number;
  businessId: number;
  productId: number;
  quantity: number;
  costPerUnit: string;
  totalCost: string;
  restockedByUserId: number;
  createdAt: string;
}

export function createRestock(data: { productId: number; quantity: number; costPerUnit: number }) {
  return apiFetch<{ restock: Restock; product: Product }>("/restocks", { method: "POST", body: data });
}
