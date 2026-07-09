// ============================================================
// peetsuh — JWT Auth Utility
// ============================================================

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.JWT_SECRET ?? "peetsuh-dev-secret-change-in-production";
const COOKIE_NAME = "peetsuh_admin_token";
const TOKEN_TTL = "8h";

export interface AdminTokenPayload {
  sub: number;
  username: string;
  iat?: number;
  exp?: number;
}

export function signAdminToken(payload: { id: number; username: string }): string {
  return jwt.sign({ sub: payload.id, username: payload.username }, SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export async function getAdminFromCookies(): Promise<AdminTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyAdminToken(token);
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
