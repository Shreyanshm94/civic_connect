"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../components/Header"; // <- correct relative path from app/admin/profile

export default function AdminProfilePage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;

    // 1) hydrate from localStorage fast for instant UI
    try {
      const stored = localStorage.getItem("admin_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setAdmin(parsed);
      }
    } catch (e) {
      console.warn("failed to parse admin_user from localStorage", e);
    }

    // 2) then attempt to fetch authoritative admin data from server
    async function refresh() {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          // no token: nothing to fetch, stop loading and keep local data
          if (mounted) setLoading(false);
          console.warn("no admin_token found in localStorage");
          return;
        }

        const res = await fetch("/api/admin/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        // helpful logs for debugging — remove in production
        console.log("[Profile] /api/admin/me status:", res.status);

        const json = await res.json().catch(() => null);
        console.log("[Profile] /api/admin/me response:", json);

        if (!mounted) return;

        if (res.ok && json?.admin) {
          setAdmin(json.admin);
          try {
            localStorage.setItem("admin_user", JSON.stringify(json.admin));
          } catch (e) { /* ignore */ }
          setErr(null);
        } else {
          if (res.status === 401) {
            // token invalid/expired: clear and redirect to login (optional)
            console.warn("admin token invalid/expired, clearing storage");
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");
            setAdmin(null);
            // router.push("/admin/login"); // uncomment if you want to force login
            setErr("Unauthorized — please sign in again");
          } else {
            setErr((json && json.error) ? String(json.error) : `Server ${res.status}`);
          }
        }
      } catch (e) {
        console.error("[Profile] fetch error:", e);
        setErr(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    refresh();
    return () => { mounted = false; };
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#f6f8f9" }}>
      <Header />

      <main style={{ maxWidth: 760, margin: "28px auto", padding: 20 }}>
        <h1>Admin Profile</h1>

        {loading && <div style={{ color: "#666" }}>Loading profile…</div>}
        {!loading && err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}

        {!loading && !admin && !err && (
          <div style={{ color: "#666" }}>No profile loaded. Please sign in.</div>
        )}

        {!loading && admin && (
          <div style={{
            marginTop: 12,
            background: "#fff",
            padding: 18,
            borderRadius: 10,
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)"
          }}>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <div style={{
                width: 80, height: 80, borderRadius: 12, background: "#dfeffb",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32
              }}>
                {admin.name ? admin.name.split(" ").map(n => n[0]).slice(0,2).join("") : "A"}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{admin.name || "Admin"}</div>
                <div style={{ color: "#666", marginTop: 6 }}>{admin.emp_id ? `Employee ID: ${admin.emp_id}` : ""}</div>
              </div>

              <div>
                <button
                  onClick={() => {
                    localStorage.removeItem("admin_token");
                    localStorage.removeItem("admin_user");
                    router.push("/admin/login");
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "#fff",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  Logout
                </button>
              </div>
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              <div>
                <div style={{ color: "#666", fontSize: 13 }}>Department</div>
                <div style={{ marginTop: 6, fontWeight: 600 }}>{admin.department || "—"}</div>
              </div>

              <div>
                <div style={{ color: "#666", fontSize: 13 }}>District</div>
                <div style={{ marginTop: 6, fontWeight: 600 }}>{admin.district || "—"}</div>
              </div>

              <div>
                <div style={{ color: "#666", fontSize: 13 }}>Phone</div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>{admin.phone || "—"}</div>
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => router.push("/admin/profile/edit")}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "#fff",
                    cursor: "pointer",
                    fontWeight: 700
                  }}
                >
                  Edit profile
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
