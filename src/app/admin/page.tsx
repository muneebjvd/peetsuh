"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed."); return; }
      router.push("/admin/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__logo">peetsuh</div>
        <h2 className="login-card__title">Admin Login</h2>
        <p className="login-card__sub">Sign in to manage orders and update statuses.</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              className="form-input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="form-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
            />
            <p className="form-hint" style={{ color: "var(--grey-mid)" }}>
              Default: peetsuh_admin_ops_99 / P33tsuh_S3cur3_Admin_2026
            </p>
          </div>
          <button type="submit" className="btn btn--red" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
