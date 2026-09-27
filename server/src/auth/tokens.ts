import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { refreshTokens } from "../db/schema.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AccessTokenPayload {
  sub: number; // userId
  businessId: number;
  role: "owner" | "seller";
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getJwtSecret()) as unknown as AccessTokenPayload;
}

function hashToken(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function generateTokenValue(): string {
  return crypto.randomBytes(48).toString("hex");
}

/** Issues a new refresh token for a user and persists its hash. Returns the raw value (shown to the client once). */
export async function issueRefreshToken(userId: number): Promise<string> {
  const value = generateTokenValue();
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(value),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return value;
}

/** Validates a raw refresh token, revokes it, and issues a replacement (rotation). Returns null if invalid/expired/revoked. */
export async function rotateRefreshToken(
  rawValue: string
): Promise<{ userId: number; newToken: string } | null> {
  const hash = hashToken(rawValue);

  const [existing] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt)))
    .limit(1);

  if (!existing || existing.expiresAt.getTime() < Date.now()) {
    return null;
  }

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, existing.id));

  const newToken = await issueRefreshToken(existing.userId);
  return { userId: existing.userId, newToken };
}

export async function revokeRefreshToken(rawValue: string): Promise<void> {
  const hash = hashToken(rawValue);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt)));
}
