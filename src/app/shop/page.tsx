"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import { PIZZAS, FRIES, DRINKS, SAUCES, DEALS } from "@/lib/menu-data";
import type { MenuItem, PizzaItem, DrinkItem } from "@/lib/menu-data";
import { useCartStore } from "@/store/cart-store";
import Link from "next/link";
import { ShoppingCart, Plus } from "lucide-react";
import Image from "next/image";

type Category = "deals" | "pizza" | "fries" | "drinks" | "sauces";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "deals", label: "Deals" },
  { id: "pizza", label: "Pizza" },
  { id: "fries", label: "Fries" },
  { id: "drinks", label: "Drinks" },
  { id: "sauces", label: "Sauces" },
];

const ITEMS_MAP: Record<Category, MenuItem[]> = {
  deals: DEALS,
  pizza: PIZZAS,
  fries: FRIES,
  drinks: DRINKS,
  sauces: SAUCES,
};

interface ItemModalProps {
  item: MenuItem;
  onClose: () => void;
}

function ItemModal({ item, onClose }: ItemModalProps) {
  const [size, setSize] = useState<string>("");
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const isBooking = item.id === "deal-buffet" || item.id === "deal-hi-tea";
  const [bookingState, setBookingState] = useState<"form" | "submitting" | "success">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [persons, setPersons] = useState("2");

  const submitBooking = async () => {
    setBookingState("submitting");
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: { name, phone, address: `TABLE BOOKING - ${persons} person(s)` },
          items: [{ itemId: "table-booking", name: "Table Booking", category: "deals", quantity: 1, unitPrice: 0, subtotal: 0 }],
          total: 0,
          channel: "shop"
        })
      });
    } catch {
      // ignore
    }
    setBookingState("success");
  };

  const getPrice = (): number | null => {
    if (item.category === "pizza") {
      const p = item as PizzaItem;
      if (!size) return null;
      return p.sizes[size as "Small" | "Medium" | "Large"];
    }
    if (item.category === "drinks") {
      const d = item as DrinkItem;
      if (!size) return null;
      return d.sizes[size as "250ml" | "1.5L"];
    }
    return (item as { price: number }).price;
  };

  const price = getPrice();
  const needsSize = item.category === "pizza" || item.category === "drinks";

  const handleAdd = () => {
    if (needsSize && !size) return;
    if (price === null) return;

    addItem({
      itemId: item.id,
      name: item.name,
      category: item.category,
      size: size || undefined,
      quantity: qty,
      unitPrice: price,
      subtotal: price * qty,
    });
    onClose();
  };

  const sizeOptions =
    item.category === "pizza"
      ? ["Small", "Medium", "Large"]
      : item.category === "drinks"
      ? ["250ml", "1.5L"]
      : [];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--white)", borderRadius: "8px", padding: "2rem", maxWidth: "460px", width: "100%" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>{item.name}</h3>
        <p style={{ color: "var(--grey-mid)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>{item.description}</p>

        {isBooking ? (
          bookingState !== "success" ? (
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Name</p>
              <input value={name} onChange={e=>setName(e.target.value)} style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", border: "1px solid var(--grey)", borderRadius: "4px" }} />
              
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Contact Number</p>
              <input value={phone} onChange={e=>setPhone(e.target.value)} style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", border: "1px solid var(--grey)", borderRadius: "4px" }} />
              
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Number of Persons</p>
              <input type="number" min="1" value={persons} onChange={e=>setPersons(e.target.value)} style={{ width: "100%", padding: "0.75rem", marginBottom: "1.5rem", border: "1px solid var(--grey)", borderRadius: "4px" }} />

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button 
                  className="btn btn--red" 
                  onClick={submitBooking} 
                  disabled={
                    !/[a-zA-Z].*[a-zA-Z].*[a-zA-Z]/.test(name) || 
                    !/^(?:03|\+923)\d{9}$/.test(phone.replace(/[^\d+]/g, "")) || 
                    !persons || 
                    bookingState === "submitting"
                  } 
                  style={{ flex: 1 }}
                >
                  {bookingState === "submitting" ? "Confirming..." : "Confirm Booking"}
                </button>
                <button className="btn btn--outline-red" onClick={onClose} disabled={bookingState === "submitting"}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: "var(--green)", fontWeight: 600, marginBottom: "1rem", fontSize: "1.1rem" }}>Booking Request Sent!</p>
              <p style={{ color: "var(--grey-mid)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                You will get a confirmation shortly, or call <strong>0300-1234567</strong> for immediate assistance.
              </p>
              <button className="btn btn--red" onClick={onClose} style={{ width: "100%" }}>Done</button>
            </div>
          )
        ) : (
          <>
            {sizeOptions.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Size</p>
                <div className="size-btns">
                  {sizeOptions.map((s) => {
                    let lbl = s;
                    if (item.category === "pizza") lbl = `${s} — Rs. ${(item as PizzaItem).sizes[s as "Small" | "Medium" | "Large"]}`;
                    if (item.category === "drinks") lbl = `${s} — Rs. ${(item as DrinkItem).sizes[s as "250ml" | "1.5L"]}`;
                    return (
                      <button key={s} className={`size-btn${size === s ? " selected" : ""}`} onClick={() => setSize(s)}>{lbl}</button>
                    );
                  })}
                </div>
              </div>
            )}

            {item.category !== "pizza" && item.category !== "drinks" && (
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--red)", fontSize: "1.2rem", marginBottom: "1.25rem" }}>
                Rs. {(item as { price: number }).price.toLocaleString()}
              </p>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Quantity</p>
              <div className="qty-stepper">
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                <span className="qty-value">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(Math.min(20, qty + 1))}>+</button>
              </div>
            </div>

            {price !== null && (
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "var(--grey-mid)", marginBottom: "1rem" }}>
                Subtotal: Rs. {(price * qty).toLocaleString()}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn--red" onClick={handleAdd} disabled={needsSize && !size} style={{ flex: 1 }}>
                Add to Cart
              </button>
              <button className="btn btn--outline-red" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("pizza");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.itemCount());

  const currentItems = ITEMS_MAP[activeCategory];

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "var(--nav-h)" }}>
        {/* Header */}
        <div style={{ background: "var(--black)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: "0.75rem" }}>Full Menu</p>
            <h1 style={{ color: "var(--white)", marginBottom: "1rem" }}>Order Online</h1>
            <p style={{ color: "var(--grey-light)", maxWidth: "480px" }}>
              Browse our menu, customize your order, and checkout. Same kitchen as the chatbot.
            </p>
          </div>
        </div>

        <div className="container section">
          {/* Category tabs */}
          <div className="cat-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`cat-tab${activeCategory === cat.id ? " active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Cart sticky bar */}
          {itemCount > 0 && (
            <div style={{ background: "var(--black)", color: "var(--white)", padding: "1rem 1.5rem", borderRadius: "6px", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                <ShoppingCart size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                {itemCount} item{itemCount > 1 ? "s" : ""} in cart
              </span>
              <Link href="/shop/cart" className="btn btn--red btn--sm">View Cart</Link>
            </div>
          )}

          {/* Items grid */}
          <div className="grid-3">
            {currentItems.map((item) => (
              <div key={item.id} className="menu-card">
                <div className="menu-card__img-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 33vw" quality={60} />
                  ) : (
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "3.5rem", opacity: 0.12, color: "var(--red)" }}>
                      {item.category === "pizza" ? "P" : item.category === "fries" ? "F" : item.category === "drinks" ? "D" : item.category === "sauces" ? "S" : ""}
                    </div>
                  )}
                </div>
                <div className="menu-card__body">
                  <p className="menu-card__name">{item.name}</p>
                  <p className="menu-card__desc">{item.description}</p>
                  {item.category === "pizza" && (
                    <p className="menu-card__price">From Rs. {(item as PizzaItem).sizes.Small.toLocaleString()}</p>
                  )}
                  {item.category === "drinks" && (
                    <p className="menu-card__price">From Rs. {(item as DrinkItem).sizes["250ml"].toLocaleString()}</p>
                  )}
                  {(item.category === "fries" || item.category === "sauces" || item.category === "deals") && (
                    <p className="menu-card__price">Rs. {(item as { price: number }).price.toLocaleString()}</p>
                  )}
                </div>
                <div className="menu-card__footer">
                  <button className="btn btn--red btn--sm" style={{ flex: 1 }} onClick={() => setSelectedItem(item)}>
                    {item.id === "deal-buffet" || item.id === "deal-hi-tea" ? "Book Table" : <><Plus size={14} /> Add to Cart</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
}
