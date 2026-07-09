"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, LogOut } from "lucide-react";

interface Order {
  id: number;
  order_ref: string;
  channel: "chat" | "shop";
  status: "new" | "preparing" | "out_for_delivery" | "done" | "cancelled";
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items_json: string;
  total: number;
  created_at: string;
}

const STATUS_OPTIONS = ["new", "preparing", "out_for_delivery", "done", "cancelled"] as const;

function StatusBadge({ status }: { status: Order["status"] }) {
  return <span className={`status-badge status-badge--${status}`}>{status}</span>;
}

function ChannelBadge({ channel }: { channel: Order["channel"] }) {
  return <span className={`channel-badge channel-badge--${channel}`}>{channel}</span>;
}

function StatusSelect({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [updating, setUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUpdating(true);
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: e.target.value }),
    });
    setUpdating(false);
    onUpdate();
  };

  return (
    <select
      value={order.status}
      onChange={handleChange}
      disabled={updating}
      style={{ padding: "0.3rem 0.6rem", borderRadius: "3px", border: "1.5px solid #D5D0C8", fontSize: "0.8rem", fontFamily: "var(--font-display)", fontWeight: 600, cursor: "pointer", background: "var(--white)" }}
    >
      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTab, setCurrentTab] = useState<"orders" | "bookings">("orders");
  const router = useRouter();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  };

  const stats = {
    total: orders.length,
    new: orders.filter((o) => o.status === "new").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    chat: orders.filter((o) => o.channel === "chat").length,
    shop: orders.filter((o) => o.channel === "shop").length,
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">peetsuh</div>
        <p className="admin-sidebar__sub">Admin Dashboard</p>
        <ul className="admin-nav">
          <li className="admin-nav__item">
            <button 
              className={currentTab === "orders" ? "active" : ""} 
              onClick={() => setCurrentTab("orders")}
            >Orders</button>
          </li>
          <li className="admin-nav__item">
            <button 
              className={currentTab === "bookings" ? "active" : ""} 
              onClick={() => setCurrentTab("bookings")}
            >Bookings</button>
          </li>
        </ul>
        <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--grey-light)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-main__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="admin-main__title">{currentTab === "orders" ? "Orders" : "Table Bookings"}</h1>
            <p style={{ color: "var(--grey-mid)", fontSize: "0.85rem", marginTop: "0.25rem" }}>Live feed — {currentTab === "orders" ? "food deliveries and pickups" : "dine-in reservations"}</p>
          </div>
          <button className="btn btn--black btn--sm" onClick={loadOrders} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card"><div className="stat-card__value">{stats.total}</div><p className="stat-card__label">Total Orders</p></div>
          <div className="stat-card"><div className="stat-card__value">{stats.new}</div><p className="stat-card__label">New</p></div>
          <div className="stat-card"><div className="stat-card__value">{stats.chat}</div><p className="stat-card__label">Via Chat</p></div>
          <div className="stat-card"><div className="stat-card__value">{stats.shop}</div><p className="stat-card__label">Via Shop</p></div>
        </div>

        {error && <p style={{ color: "var(--red)", marginBottom: "1rem" }}>{error}</p>}

        {loading ? (
          <p style={{ color: "var(--grey-mid)" }}>Loading...</p>
        ) : orders.filter(o => currentTab === "orders" ? !o.customer_address.includes("TABLE BOOKING") : o.customer_address.includes("TABLE BOOKING")).length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--grey-light)" }}>No {currentTab} yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Channel</th>
                  <th>Customer</th>
                  <th>Items / Deal</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .filter(o => currentTab === "orders" ? !o.customer_address.includes("TABLE BOOKING") : o.customer_address.includes("TABLE BOOKING"))
                  .map((order) => {
                  let parsedItems: { name: string; quantity: number }[] = [];
                  try { parsedItems = JSON.parse(order.items_json); } catch { /* empty */ }
                  return (
                    <tr key={order.id}>
                      <td><code style={{ fontSize: "0.78rem", fontFamily: "monospace" }}>{order.order_ref}</code></td>
                      <td><ChannelBadge channel={order.channel} /></td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{order.customer_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--grey-light)", marginTop: "0.1rem" }}>{order.customer_phone}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--grey-mid)", marginTop: "0.3rem", maxWidth: "200px", lineHeight: "1.3" }}>
                          {order.customer_address}
                        </div>
                      </td>
                      <td style={{ maxWidth: "180px" }}>
                        <div style={{ fontSize: "0.8rem", color: "var(--grey-mid)", lineHeight: 1.5 }}>
                          {parsedItems.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                        </div>
                      </td>
                      <td><strong style={{ fontFamily: "var(--font-display)" }}>Rs. {order.total.toLocaleString()}</strong></td>
                      <td><StatusBadge status={order.status} /></td>
                      <td style={{ fontSize: "0.78rem", color: "var(--grey-light)" }}>{new Date(order.created_at).toLocaleString("en-PK")}</td>
                      <td><StatusSelect order={order} onUpdate={loadOrders} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
