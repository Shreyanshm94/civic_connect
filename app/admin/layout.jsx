// app/admin/layout.jsx
"use client";

import Link from "next/link";

export default function AdminLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7fafc" }}>
      <header style={{
        background: "#ffffff",
        borderBottom: "1px solid #e6e6e6",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {/* ✅ No <a> inside Link */}
          <Link href="/" style={{ textDecoration: "none", color: "#111", fontWeight: 700 }}>
            Civic Connect
          </Link>
          <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/admin/dashboard" style={{ color: "#444" }}>Dashboard</Link>
            <Link href="/admin/signup" style={{ color: "#444" }}>Signup</Link>
            <Link href="/admin/login" style={{ color: "#444" }}>Login</Link>
          </nav>
        </div>

        <div style={{ fontSize: 14, color: "#666" }}>Admin area</div>
      </header>

      <main style={{ padding: 24 }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>{children}</div>
      </main>

      <footer style={{ padding: 20, textAlign: "center", color: "#888", fontSize: 13 }}>
        &copy; {new Date().getFullYear()} Civic Connect — Admin
      </footer>
    </div>
  );
}
