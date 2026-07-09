import { NextRequest, NextResponse } from "next/server";
import { validateOrder, sanitizeString } from "@/lib/validation";
import { insertOrder } from "@/lib/db";
import { generateOrderRef } from "@/lib/order-ref";
import { isRateLimited } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown";

    // Rate limit: 10 orders per minute per IP
    if (isRateLimited(ip, "orders", 10, 60)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate all fields server-side
    const errors = validateOrder(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const { contact, items, total, channel } = body;

    // Generate order reference
    const orderRef = generateOrderRef();

    // Sanitize and insert (parameterized queries — no SQL injection possible)
    const order = insertOrder({
      order_ref: orderRef,
      channel: channel as "chat" | "shop",
      customer_name: sanitizeString(contact.name),
      customer_phone: sanitizeString(contact.phone, 20),
      customer_address: sanitizeString(contact.address, 300),
      items_json: JSON.stringify(items),
      total: Math.round(total),
    });

    return NextResponse.json({
      success: true,
      orderRef: order.order_ref,
      orderId: order.id,
    });
  } catch (err) {
    console.error("[orders/route] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Only admin can view orders (middleware handles auth)
  // This route is called by admin dashboard via server component
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
