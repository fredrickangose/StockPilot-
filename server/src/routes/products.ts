import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { products } from "../db/schema.js";
import { requireAuth, requireOwner } from "../auth/middleware.js";

export const productsRouter = Router();

productsRouter.use(requireAuth);

productsRouter.get("/", async (req, res) => {
  const businessId = req.user!.businessId;
  const rows = await db.select().from(products).where(eq(products.businessId, businessId));
  res.json({ products: rows });
});

productsRouter.get("/barcode/:code", async (req, res) => {
  const businessId = req.user!.businessId;
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.businessId, businessId), eq(products.barcode, req.params.code)))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "No product with that barcode." });
    return;
  }
  res.json({ product });
});

const createProductSchema = z.object({
  name: z.string().trim().min(1),
  barcode: z.string().trim().min(1),
  costPrice: z.number().nonnegative(),
  sellPrice: z.number().nonnegative(),
  category: z.string().trim().optional(),
});

productsRouter.post("/", requireOwner, async (req, res) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { name, barcode, costPrice, sellPrice, category } = parsed.data;
  const businessId = req.user!.businessId;

  try {
    const [product] = await db
      .insert(products)
      .values({
        businessId,
        name,
        barcode,
        costPrice: costPrice.toFixed(2),
        sellPrice: sellPrice.toFixed(2),
        category: category ?? null,
      })
      .returning();

    res.status(201).json({ product });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "23505") {
      res.status(409).json({ error: "A product with that barcode already exists." });
      return;
    }
    console.error("create product failed:", error);
    res.status(500).json({ error: "Could not create product." });
  }
});

const updateProductSchema = z.object({
  name: z.string().trim().min(1).optional(),
  costPrice: z.number().nonnegative().optional(),
  sellPrice: z.number().nonnegative().optional(),
  category: z.string().trim().nullable().optional(),
});

productsRouter.patch("/:id", requireOwner, async (req, res) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid product id." });
    return;
  }

  const businessId = req.user!.businessId;
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.costPrice !== undefined) updates.costPrice = parsed.data.costPrice.toFixed(2);
  if (parsed.data.sellPrice !== undefined) updates.sellPrice = parsed.data.sellPrice.toFixed(2);
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;

  const [product] = await db
    .update(products)
    .set(updates)
    .where(and(eq(products.id, id), eq(products.businessId, businessId)))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.json({ product });
});
