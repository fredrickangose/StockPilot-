import { apiFetch } from "./client";
import type { Product, Sale } from "./types";

export function createSale(data: { productId: number; quantity: number }) {
  return apiFetch<{ sale: Sale; product: Product }>("/sales", { method: "POST", body: data });
}

export function listMySales() {
  return apiFetch<{ sales: Sale[] }>("/sales");
}
