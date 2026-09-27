import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { businesses, users } from "../db/schema.js";
import { hashSecret, verifySecret } from "../auth/password.js";
import { signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from "../auth/tokens.js";
import { requireAuth } from "../auth/middleware.js";

export const authRouter = Router();

/** Lets a client with a still-valid access token restore who's signed in (e.g. after an app restart). */
authRouter.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user!.sub)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, user.businessId))
    .limit(1);

  res.json({
    user: { id: user.id, name: user.name, role: user.role },
    business: business ? { id: business.id, name: business.name } : undefined,
  });
});

const registerOwnerSchema = z.object({
  businessName: z.string().trim().min(1),
  ownerName: z.string().trim().min(1),
  phone: z.string().trim().min(7),
  password: z.string().min(6),
});

authRouter.post("/register-owner", async (req, res) => {
  const parsed = registerOwnerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { businessName, ownerName, phone, password } = parsed.data;

  try {
    const passwordHash = await hashSecret(password);

    const result = await db.transaction(async (tx) => {
      const [business] = await tx
        .insert(businesses)
        .values({ name: businessName })
        .returning();

      const [owner] = await tx
        .insert(users)
        .values({
          businessId: business.id,
          role: "owner",
          name: ownerName,
          phone,
          passwordHash,
        })
        .returning();

      return { business, owner };
    });

    const accessToken = signAccessToken({
      sub: result.owner.id,
      businessId: result.business.id,
      role: "owner",
    });
    const refreshToken = await issueRefreshToken(result.owner.id);

    res.status(201).json({
      accessToken,
      refreshToken,
      business: { id: result.business.id, name: result.business.name },
      user: { id: result.owner.id, name: result.owner.name, role: "owner" },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "23505") {
      res.status(409).json({ error: "That phone number is already registered." });
      return;
    }
    console.error("register-owner failed:", error);
    res.status(500).json({ error: "Could not register business." });
  }
});

const loginOwnerSchema = z.object({
  phone: z.string().trim().min(1),
  password: z.string().min(1),
});

authRouter.post("/login-owner", async (req, res) => {
  const parsed = loginOwnerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { phone, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.phone, phone), eq(users.role, "owner")))
    .limit(1);

  if (!user || !user.passwordHash || !(await verifySecret(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid phone number or password." });
    return;
  }

  const accessToken = signAccessToken({ sub: user.id, businessId: user.businessId, role: "owner" });
  const refreshToken = await issueRefreshToken(user.id);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, role: "owner" },
  });
});

const loginSellerSchema = z.object({
  phone: z.string().trim().min(1),
  pin: z.string().min(1),
});

authRouter.post("/login-seller", async (req, res) => {
  const parsed = loginSellerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { phone, pin } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.phone, phone), eq(users.role, "seller")))
    .limit(1);

  if (!user || !user.pinHash || !(await verifySecret(pin, user.pinHash))) {
    res.status(401).json({ error: "Invalid phone number or PIN." });
    return;
  }

  const accessToken = signAccessToken({ sub: user.id, businessId: user.businessId, role: "seller" });
  const refreshToken = await issueRefreshToken(user.id);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, role: "seller" },
  });
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

authRouter.post("/refresh", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const rotated = await rotateRefreshToken(parsed.data.refreshToken);
  if (!rotated) {
    res.status(401).json({ error: "Invalid or expired refresh token." });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.id, rotated.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found." });
    return;
  }

  const accessToken = signAccessToken({
    sub: user.id,
    businessId: user.businessId,
    role: user.role as "owner" | "seller",
  });

  res.json({ accessToken, refreshToken: rotated.newToken });
});

authRouter.post("/logout", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  await revokeRefreshToken(parsed.data.refreshToken);
  res.status(204).send();
});
