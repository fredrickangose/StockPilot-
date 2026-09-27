import { Router } from "express";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { products, restocks } from "../db/schema.js";
import { requireAuth, requireOwner } from "../auth/middleware.js";

export const restocksRouter = Router();

restocksRouter.use(requireAuth, requireOwner);

const createRestockSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  costPerUnit: z.number().nonnegative(),
});

restocksRouter.post("/", async (req, res) => {
  const parsed = createRestockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { productId, quantity, costPerUnit } = parsed.data;
  const businessId = req.user!.businessId;
  const totalCost = quantity * costPerUnit;

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

      const [restock] = await tx
        .insert(restocks)
        .values({
          businessId,
          productId,
          quantity,
          costPerUnit: costPerUnit.toFixed(2),
          totalCost: totalCost.toFixed(2),
          restockedByUserId: req.user!.sub,
        })
        .returning();

      const [updatedProduct] = await tx
        .update(products)
        .set({ currentStock: sql`${products.currentStock} + ${quantity}` })
        .where(eq(products.id, productId))
        .returning();

      return { restock, product: updatedProduct };
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    console.error("create restock failed:", error);
    res.status(500).json({ error: "Could not record restock." });
  }
});

restocksRouter.get("/", async (req, res) => {
  const businessId = req.user!.businessId;
  const rows = await db.select().from(restocks).where(eq(restocks.businessId, businessId));
  res.json({ restocks: rows });
});
