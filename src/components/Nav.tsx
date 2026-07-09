"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import Logo from "./Logo";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="container nav__inner">
        <Link href="/" className="nav__logo" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Logo style={{ width: "1.2em", height: "1.2em" }} />
          <span>peet<span>suh</span></span>
        </Link>

        <ul className="nav__links">
          <li><Link href="/shop">Menu</Link></li>
          <li><Link href="/chat">Order via Chat</Link></li>
          <li><Link href="/#deals">Deals</Link></li>
        </ul>

        <div className="nav__actions">
          <Link href="/shop/cart" className="nav__cart-btn">
            <ShoppingCart size={16} />
            Cart
            {itemCount > 0 && <span className="nav__cart-count">{itemCount}</span>}
          </Link>
          <button
            className="nav__mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--charcoal)", padding: "2rem", borderBottom: "1px solid var(--grey)", boxShadow: "var(--shadow-md)" }}>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <li><Link href="/shop" onClick={() => setMobileOpen(false)} style={{ color: "var(--white)", fontWeight: 600, fontSize: "1.2rem", display: "block" }}>Menu</Link></li>
            <li><Link href="/chat" onClick={() => setMobileOpen(false)} style={{ color: "var(--white)", fontWeight: 600, fontSize: "1.2rem", display: "block" }}>Order via Chat</Link></li>
            <li><Link href="/#deals" onClick={() => setMobileOpen(false)} style={{ color: "var(--white)", fontWeight: 600, fontSize: "1.2rem", display: "block" }}>Deals</Link></li>
          </ul>
        </div>
      )}
    </nav>
  );
}
