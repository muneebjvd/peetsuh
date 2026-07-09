import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookies } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  }

  const body = await req.json();
  const { status } = body;

  const validStatuses = ["new", "preparing", "done", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 422 });
  }

  updateOrderStatus(orderId, status);

  return NextResponse.json({ success: true });
}
