import Nav from "@/components/Nav";
import Link from "next/link";
import { DEALS, PIZZAS } from "@/lib/menu-data";
import HeroSlider from "@/components/HeroSlider";

export default function HomePage() {
  return (
    <>
      <Nav />

      {/* ── Hero ──────────────────────────────────── */}
      <section className="hero">
        <HeroSlider />
        <div className="hero__bg-text">PEETSUH</div>
        <div className="container">
          <div className="hero__content">
            <p className="hero__label">Now ordering in Lahore</p>
            <h1 className="hero__title">
              Pizza Worth<br />
              <em>Talking About.</em>
            </h1>
            <p className="hero__subtitle">
              Order through our smart chatbot or browse the full menu. 
              Same kitchen, same recipe, two ways to get it to your door.
            </p>
            <div className="hero__actions">
              <Link href="/chat" className="btn btn--red btn--lg">Chat to Order</Link>
              <Link href="/shop" className="btn btn--outline btn--lg">Browse Menu</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two paths CTA ──────────────────────────── */}
      <section className="section section--cream">
        <div className="container">
          <div className="grid-2" style={{ gap: "2rem" }}>
            <div style={{ background: "var(--black)", padding: "3rem", borderRadius: "6px" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--red)", marginBottom: "1rem" }}>Chat</p>
              <h3 style={{ color: "var(--white)", marginBottom: "1rem" }}>Order by Conversation</h3>
              <p style={{ color: "var(--grey-light)", marginBottom: "2rem", lineHeight: 1.7 }}>
                Talk to our rule-based ordering assistant. No AI, no LLM — just a hand-built 
                fuzzy-matching engine that understands what you want, even with typos.
              </p>
              <Link href="/chat" className="btn btn--red">Start Chatting</Link>
            </div>
            <div style={{ background: "var(--white)", padding: "3rem", borderRadius: "6px", border: "1px solid #E5E2DC" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--red)", marginBottom: "1rem" }}>Shop</p>
              <h3 style={{ color: "var(--black)", marginBottom: "1rem" }}>Browse &amp; Add to Cart</h3>
              <p style={{ color: "var(--grey-mid)", marginBottom: "2rem", lineHeight: 1.7 }}>
                Classic e-commerce experience. Browse by category, customize your pizza size, 
                build a cart, then checkout. Same backend as the chatbot.
              </p>
              <Link href="/shop" className="btn btn--black">Browse Menu</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Deals ──────────────────────────────────── */}
      <section className="section section--dark" id="deals">
        <div className="container">
          <div className="section-header">
            <p className="section-header__label">Current Offers</p>
            <h2 style={{ color: "var(--white)" }}>Today&apos;s Deals</h2>
          </div>
          <div className="grid-3">
            {DEALS.map((deal) => (
              <div
                key={deal.id}
                style={{ background: "var(--charcoal)", border: "1px solid var(--grey)", borderRadius: "6px", padding: "2rem" }}
              >
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                  {deal.category}
                </p>
                <h3 style={{ color: "var(--white)", marginBottom: "0.75rem" }}>{deal.name}</h3>
                <p style={{ color: "var(--grey-light)", fontSize: "0.88rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>{deal.description}</p>
                <ul style={{ listStyle: "none", marginBottom: "1.5rem" }}>
                  {deal.includes.map((inc) => (
                    <li key={inc} style={{ fontSize: "0.82rem", color: "var(--grey-light)", padding: "0.2rem 0", borderBottom: "1px solid var(--grey)" }}>
                      {inc}
                    </li>
                  ))}
                </ul>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--red)", fontSize: "1.3rem" }}>
                    Rs. {deal.price.toLocaleString()}
                  </span>
                  <Link href="/shop" className="btn btn--red btn--sm">
                    {deal.id === "deal-buffet" || deal.id === "deal-hi-tea" ? "Book Table" : "Order Now"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Pizzas ─────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <p className="section-header__label">Most Ordered</p>
            <h2>Fan Favourites</h2>
            <p className="section-header__sub" style={{ marginTop: "0.5rem" }}>
              Our top-rated pizzas. Available in Small, Medium, and Large.
            </p>
          </div>
          <div className="grid-3">
            {PIZZAS.slice(0, 6).map((pizza) => (
              <Link href="/shop" key={pizza.id} className="menu-card" style={{ display: "block" }}>
                <div className="menu-card__img-wrap" style={{ background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {pizza.image ? (
                    <img src={pizza.image} alt={pizza.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "3rem", opacity: 0.15 }}>P</div>
                  )}
                </div>
                <div className="menu-card__body">
                  <p className="menu-card__name">{pizza.name}</p>
                  <p className="menu-card__desc">{pizza.description}</p>
                  <p className="menu-card__price">From Rs. {pizza.sizes.Small.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <Link href="/shop" className="btn btn--outline-red btn--lg">See All 15 Pizzas</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer style={{ background: "var(--black)", padding: "3rem 0", borderTop: "1px solid var(--grey)" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem", color: "var(--red)" }}>peetsuh</div>
            <p style={{ fontSize: "0.8rem", color: "var(--grey-light)", marginTop: "0.25rem" }}>A portfolio project — CV demonstration of full-stack engineering.</p>
          </div>
          <div style={{ display: "flex", gap: "2rem" }}>
            <Link href="/shop" style={{ color: "var(--grey-light)", fontSize: "0.85rem" }}>Menu</Link>
            <Link href="/chat" style={{ color: "var(--grey-light)", fontSize: "0.85rem" }}>Chat</Link>
            <Link href="/admin" style={{ color: "var(--grey-light)", fontSize: "0.85rem" }}>Admin</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
