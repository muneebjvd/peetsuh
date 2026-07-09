import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminUser, createAdminUser } from "@/lib/db";
import { signAdminToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required." }, { status: 400 });
    }

    // Seed default admin if no admin exists yet
    let user = getAdminUser(username);
    if (!user) {
      // Auto-create admin on first login with env password
      const defaultAdminUser = process.env.ADMIN_USERNAME ?? "admin";
      const defaultAdminPass = process.env.ADMIN_PASSWORD ?? "peetsuh-admin-2024";

      if (username === defaultAdminUser && password === defaultAdminPass) {
        const hash = await bcrypt.hash(password, 12);
        createAdminUser(username, hash);
        user = getAdminUser(username)!;
      } else {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
      }
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = signAdminToken({ id: user.id, username: user.username });

    const response = NextResponse.json({ success: true, username: user.username });
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[auth/login] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
