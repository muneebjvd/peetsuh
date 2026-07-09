"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import { useCartStore } from "@/store/cart-store";
import { validateContact, normalizePhone } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCartStore();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const count = itemCount();
  const orderTotal = total();

  const fieldError = (field: string) => errors.find((e) => e.field === field)?.message;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const contactErrors = validateContact(form);
    if (contactErrors.length > 0) { setErrors(contactErrors); return; }
    setErrors([]);
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: { ...form, phone: normalizePhone(form.phone) },
          items,
          total: orderTotal,
          channel: "shop",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors(data.errors ?? [{ field: "form", message: "Something went wrong." }]); return; }
      clearCart();
      router.push(`/shop/confirmation?ref=${data.orderRef}`);
    } catch {
      setErrors([{ field: "form", message: "Network error. Please try again." }]);
    } finally {
      setSubmitting(false);
    }
  };

  if (count === 0 && step === "cart") {
    return (
      <>
        <Nav />
        <div style={{ paddingTop: "var(--nav-h)", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ marginBottom: "1rem" }}>Your cart is empty</h2>
            <p style={{ color: "var(--grey-mid)", marginBottom: "2rem" }}>Add some items from the menu to get started.</p>
            <a href="/shop" className="btn btn--red">Browse Menu</a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "var(--nav-h)" }}>
        <div style={{ background: "var(--black)", padding: "3rem 0 2.5rem" }}>
          <div className="container">
            <h1 style={{ color: "var(--white)" }}>{step === "cart" ? "Your Cart" : "Checkout"}</h1>
            <p style={{ color: "var(--grey-light)", marginTop: "0.5rem" }}>
              {step === "cart" ? `${count} item${count > 1 ? "s" : ""}` : "Enter your delivery details"}
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: "3rem 1.5rem" }}>
          {step === "cart" ? (
            <div className="grid-2" style={{ gap: "3rem", alignItems: "start" }}>
              {/* Items */}
              <div>
                {items.map((item) => (
                  <div key={`${item.itemId}-${item.size}`} style={{ display: "flex", gap: "1rem", padding: "1.25rem 0", borderBottom: "1px solid #E5E2DC", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{item.name}</p>
                      {item.size && <p style={{ fontSize: "0.8rem", color: "var(--grey-light)" }}>{item.size}</p>}
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--red)", marginTop: "0.25rem" }}>Rs. {item.subtotal.toLocaleString()}</p>
                    </div>
                    <div className="qty-stepper">
                      <button className="qty-btn" onClick={() => updateQuantity(item.itemId, item.size, item.quantity - 1)}>-</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.itemId, item.size, item.quantity + 1)}>+</button>
                    </div>
                    <button onClick={() => removeItem(item.itemId, item.size)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--grey-light)", padding: "0.25rem" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div style={{ background: "var(--white)", border: "1px solid #E5E2DC", borderRadius: "6px", padding: "1.5rem", position: "sticky", top: "calc(var(--nav-h) + 1rem)" }}>
                <h3 style={{ marginBottom: "1rem" }}>Order Summary</h3>
                {items.map((item) => (
                  <div key={`sum-${item.itemId}-${item.size}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.88rem" }}>
                    <span>{item.name}{item.size ? ` (${item.size})` : ""} x{item.quantity}</span>
                    <span>Rs. {item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #E5E2DC", marginTop: "1rem", paddingTop: "1rem", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Total</span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--red)", fontSize: "1.2rem" }}>Rs. {orderTotal.toLocaleString()}</span>
                </div>
                <button className="btn btn--red" style={{ width: "100%", marginTop: "1.5rem" }} onClick={() => setStep("checkout")}>
                  Proceed to Checkout
                </button>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: "540px" }}>
              <form onSubmit={handleCheckout}>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-name">Full Name</label>
                  <input id="checkout-name" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Muhammad Ali" />
                  {fieldError("name") && <p className="form-error">{fieldError("name")}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-phone">Phone Number</label>
                  <input id="checkout-phone" className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03001234567" />
                  <p className="form-hint">Pakistani mobile number (e.g. 03001234567 or +923001234567)</p>
                  {fieldError("phone") && <p className="form-error">{fieldError("phone")}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-address">Delivery Address</label>
                  <input id="checkout-address" className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House 12, Street 5, DHA Phase 2, Lahore" />
                  {fieldError("address") && <p className="form-error">{fieldError("address")}</p>}
                </div>

                {fieldError("form") && <p className="form-error" style={{ marginBottom: "1rem" }}>{fieldError("form")}</p>}

                <div style={{ background: "var(--cream)", borderRadius: "6px", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "0.5rem" }}>Order Total: Rs. {orderTotal.toLocaleString()}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--grey-mid)" }}>{count} item{count > 1 ? "s" : ""} — Cash on delivery</p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="submit" className="btn btn--red" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? "Placing Order..." : "Place Order"}
                  </button>
                  <button type="button" className="btn btn--outline-red" onClick={() => setStep("cart")}>Back</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
