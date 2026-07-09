import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { DbOrder } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");

  if (!ref || ref.trim().length === 0) {
    return NextResponse.json({ error: "Missing tracking reference." }, { status: 400 });
  }

  try {
    const db = getDb();
    
    // We expect the user to provide either the full order_ref or the last 7 digits
    let queryRef = ref.trim().toUpperCase();
    
    // If they provided exactly 7 characters, search for it as a suffix
    let order: DbOrder | undefined;
    if (queryRef.length === 7) {
      order = db.prepare(`SELECT * FROM orders WHERE order_ref LIKE ?`).get(`%${queryRef}`) as DbOrder | undefined;
    } else {
      order = db.prepare(`SELECT * FROM orders WHERE order_ref = ?`).get(queryRef) as DbOrder | undefined;
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ 
      order_ref: order.order_ref,
      status: order.status,
      created_at: order.created_at
    });
  } catch (err) {
    console.error("[orders/track] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
