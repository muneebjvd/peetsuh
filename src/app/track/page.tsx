"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import Link from "next/link";
import { Search } from "lucide-react";

export default function TrackOrderPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [orderData, setOrderData] = useState<{ order_ref: string; status: string; created_at: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setStatus("loading");
    setErrorMsg("");
    setOrderData(null);

    try {
      const res = await fetch(`/api/orders/track?ref=${encodeURIComponent(trackingNumber)}`);
      const data = await res.json();

      if (res.ok) {
        setOrderData(data);
        setStatus("success");
      } else {
        setErrorMsg(data.error || "Order not found");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "Received 📝";
      case "preparing": return "Preparing 🧑‍🍳";
      case "out_for_delivery": return "Out for Delivery 🛵";
      case "done": return "Completed / Delivered ✅";
      case "cancelled": return "Cancelled ❌";
      default: return status;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--cream)" }}>
      <Nav />
      <div style={{ flex: 1, padding: "8rem 1.5rem 4rem", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 800, color: "var(--black)", marginBottom: "1.5rem", textAlign: "center" }}>
          Track Your Order
        </h1>
        <p style={{ color: "var(--grey-mid)", textAlign: "center", marginBottom: "3rem" }}>
          Enter your full order number or the last 7 digits to check its current status.
        </p>

        <form onSubmit={handleTrack} style={{ display: "flex", gap: "0.5rem", marginBottom: "3rem" }}>
          <input
            type="text"
            placeholder="e.g. A1B2C3D"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            style={{
              flex: 1,
              padding: "1rem",
              borderRadius: "4px",
              border: "1px solid var(--grey)",
              fontSize: "1.1rem",
              fontFamily: "var(--font-mono)"
            }}
          />
          <button type="submit" className="btn btn--red" style={{ padding: "0 1.5rem" }} disabled={status === "loading"}>
            {status === "loading" ? "..." : <Search size={24} />}
          </button>
        </form>

        {status === "error" && (
          <div style={{ background: "rgba(255,0,0,0.1)", color: "var(--red)", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
            {errorMsg}
          </div>
        )}

        {status === "success" && orderData && (
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--grey)" }}>
            <div style={{ fontSize: "0.9rem", color: "var(--grey-mid)", marginBottom: "0.5rem" }}>ORDER NUMBER</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", color: "var(--black)", fontWeight: 600, marginBottom: "1.5rem" }}>
              {orderData.order_ref}
            </div>
            
            <div style={{ fontSize: "0.9rem", color: "var(--grey-mid)", marginBottom: "0.5rem" }}>CURRENT STATUS</div>
            <div style={{ fontSize: "1.5rem", color: "var(--red)", fontWeight: 800, fontFamily: "var(--font-display)" }}>
              {getStatusText(orderData.status)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
