import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { products, restocks, sales, users } from "../db/schema.js";
import { requireAuth, requireOwner } from "../auth/middleware.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requireOwner);

reportsRouter.get("/summary", async (req, res) => {
  const businessId = req.user!.businessId;

  const [investmentRow] = await db
    .select({ total: sql<string>`coalesce(sum(${restocks.totalCost}), 0)` })
    .from(restocks)
    .where(eq(restocks.businessId, businessId));

  const [salesRow] = await db
    .select({ total: sql<string>`coalesce(sum(${sales.totalAmount}), 0)` })
    .from(sales)
    .where(eq(sales.businessId, businessId));

  // Cost of goods sold: for each sale, quantity * the product's current cost price.
  // (Uses the product's latest cost price rather than a per-sale historical cost,
  // which is a reasonable approximation until restocks track cost lots individually.)
  const [cogsRow] = await db
    .select({
      total: sql<string>`coalesce(sum(${sales.quantity} * ${products.costPrice}), 0)`,
    })
    .from(sales)
    .innerJoin(products, eq(products.id, sales.productId))
    .where(eq(sales.businessId, businessId));

  const [stockValueRow] = await db
    .select({
      total: sql<string>`coalesce(sum(${products.currentStock} * ${products.costPrice}), 0)`,
    })
    .from(products)
    .where(eq(products.businessId, businessId));

  const perSeller = await db
    .select({
      sellerId: sales.sellerId,
      sellerName: users.name,
      totalSales: sql<string>`coalesce(sum(${sales.totalAmount}), 0)`,
      saleCount: sql<number>`count(*)::int`,
    })
    .from(sales)
    .innerJoin(users, eq(users.id, sales.sellerId))
    .where(eq(sales.businessId, businessId))
    .groupBy(sales.sellerId, users.name);

  const totalSales = Number(salesRow.total);
  const costOfGoodsSold = Number(cogsRow.total);

  res.json({
    totalInvestment: Number(investmentRow.total),
    totalSales,
    costOfGoodsSold,
    profit: totalSales - costOfGoodsSold,
    currentStockValue: Number(stockValueRow.total),
    perSeller: perSeller.map((row) => ({
      sellerId: row.sellerId,
      sellerName: row.sellerName,
      totalSales: Number(row.totalSales),
      saleCount: row.saleCount,
    })),
  });
});
