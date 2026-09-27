import { apiFetch } from "./client";
import type { Seller } from "./types";

export function listSellers() {
  return apiFetch<{ sellers: Seller[] }>("/sellers");
}

export function createSeller(data: { name: string; phone: string; pin: string }) {
  return apiFetch<{ seller: Seller }>("/sellers", { method: "POST", body: data });
}

export function deleteSeller(id: number) {
  return apiFetch<void>(`/sellers/${id}`, { method: "DELETE" });
}
