"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

function ConfirmationContent() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? "N/A";
  return (
    <>
      <Nav />
      <div className="confirm-page">
        <div className="confirm-card">
          <div className="confirm-card__icon">
            <CheckCircle size={28} color="white" />
          </div>
          <h2>Order Placed!</h2>
          <p className="confirm-card__ref">{ref}</p>
          <p className="confirm-card__msg">
            Your order is confirmed. Our team will start preparing it shortly.
            Keep your order reference safe — we may ask for it on delivery.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/shop" className="btn btn--red">Order Again</Link>
            <Link href="/" className="btn btn--outline-red">Go Home</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ padding: "6rem", textAlign: "center" }}>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
