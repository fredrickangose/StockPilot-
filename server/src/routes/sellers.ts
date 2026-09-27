import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { requireAuth, requireOwner } from "../auth/middleware.js";
import { hashSecret } from "../auth/password.js";

export const sellersRouter = Router();

sellersRouter.use(requireAuth, requireOwner);

sellersRouter.get("/", async (req, res) => {
  const businessId = req.user!.businessId;
  const rows = await db
    .select({ id: users.id, name: users.name, phone: users.phone, createdAt: users.createdAt })
    .from(users)
    .where(and(eq(users.businessId, businessId), eq(users.role, "seller")));
  res.json({ sellers: rows });
});

const createSellerSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(7),
  pin: z.string().trim().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
});

sellersRouter.post("/", async (req, res) => {
  const parsed = createSellerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { name, phone, pin } = parsed.data;
  const businessId = req.user!.businessId;

  try {
    const pinHash = await hashSecret(pin);
    const [seller] = await db
      .insert(users)
      .values({ businessId, role: "seller", name, phone, pinHash })
      .returning();

    res.status(201).json({ seller: { id: seller.id, name: seller.name, phone: seller.phone } });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "23505") {
      res.status(409).json({ error: "A seller with that phone number already exists." });
      return;
    }
    console.error("create seller failed:", error);
    res.status(500).json({ error: "Could not create seller." });
  }
});

sellersRouter.delete("/:id", async (req, res) => {
  const businessId = req.user!.businessId;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid seller id." });
    return;
  }

  const deleted = await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.businessId, businessId), eq(users.role, "seller")))
    .returning({ id: users.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "Seller not found." });
    return;
  }

  res.status(204).send();
});
