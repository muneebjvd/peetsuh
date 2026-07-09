import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookies } from "@/lib/auth";
import { getOrders } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0);

  const orders = getOrders(limit, offset);
  return NextResponse.json({ orders });
}
