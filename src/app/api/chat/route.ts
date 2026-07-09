import { NextRequest, NextResponse } from "next/server";
import { processMessage, getSession, handleCheckoutIntent } from "@/lib/state-machine";
import { isRateLimited } from "@/lib/db";

const RATE_LIMIT_MAX = 30;
const RATE_WINDOW_SECS = 60;

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown";

    // Rate limit: 30 messages per minute per IP
    if (isRateLimited(ip, "chat", RATE_LIMIT_MAX, RATE_WINDOW_SECS)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { sessionId, message, action } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
    }

    if (action === "checkout") {
      const response = handleCheckoutIntent(sessionId);
      return NextResponse.json({ response, session: getSession(sessionId) });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Missing message." }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ error: "Message too long." }, { status: 400 });
    }

    // Check for checkout trigger in message
    const lower = message.toLowerCase().trim();
    if (lower === "checkout" || lower === "proceed to checkout") {
      const response = handleCheckoutIntent(sessionId);
      return NextResponse.json({ response, session: getSession(sessionId) });
    }

    const response = processMessage(sessionId, message);
    const session = getSession(sessionId);

    return NextResponse.json({ response, session });
  } catch (err) {
    console.error("[chat/route] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
