import { Router } from "express";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { products, sales } from "../db/schema.js";
import { requireAuth } from "../auth/middleware.js";

export const salesRouter = Router();

salesRouter.use(requireAuth);

const createSaleSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

salesRouter.post("/", async (req, res) => {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { productId, quantity } = parsed.data;
  const businessId = req.user!.businessId;

  try {
    const result = await db.transaction(async (tx) => {
      const [product] = await tx
        .select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.businessId, businessId)))
        .limit(1);

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }
      if (product.currentStock < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const unitPrice = Number(product.sellPrice);
      const totalAmount = unitPrice * quantity;

      const [sale] = await tx
        .insert(sales)
        .values({
          businessId,
          productId,
          sellerId: req.user!.sub,
          quantity,
          unitPrice: unitPrice.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
        })
        .returning();

      const [updatedProduct] = await tx
        .update(products)
        .set({ currentStock: sql`${products.currentStock} - ${quantity}` })
        .where(eq(products.id, productId))
        .returning();

      return { sale, product: updatedProduct };
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      res.status(409).json({ error: "Not enough stock for this sale." });
      return;
    }
    console.error("create sale failed:", error);
    res.status(500).json({ error: "Could not record sale." });
  }
});

/** Sellers see only their own sales; owners see everyone's. */
salesRouter.get("/", async (req, res) => {
  const businessId = req.user!.businessId;
  const conditions = [eq(sales.businessId, businessId)];
  if (req.user!.role === "seller") {
    conditions.push(eq(sales.sellerId, req.user!.sub));
  }
  const rows = await db.select().from(sales).where(and(...conditions));
  res.json({ sales: rows });
});
