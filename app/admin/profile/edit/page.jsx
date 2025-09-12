// app/admin/profile/edit/page.jsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../../components/Header";

export default function AdminProfileEditPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          router.push("/admin/login");
          return;
        }
        const res = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");
            router.push("/admin/login");
            return;
          }
          throw new Error(`Server ${res.status}`);
        }
        const json = await res.json();
        if (!mounted) return;
        setAdmin(json.admin);
      } catch (err) {
        console.error("load admin error", err);
        setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!admin) return;
    // Basic validation
    if (!admin.name || !admin.emp_id) {
      setError("Name and Employee ID required");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: admin.name,
          department: admin.department,
          district: admin.district,
          phone: admin.phone
        })
      });
      const json = await res.json().catch(()=>null);
      if (!res.ok) {
        throw new Error(json?.error || `Server ${res.status}`);
      }
      // save updated admin to localStorage and go back to profile
      if (json?.admin) {
        try { localStorage.setItem("admin_user", JSON.stringify(json.admin)); } catch {}
        router.push("/admin/profile");
      } else {
        router.push("/admin/profile");
      }
    } catch (err) {
      console.error("save error", err);
      setError(String(err.message || err));
    } finally {
      setSaving(false);
    }
  }

  function updateField(k, v) {
    setAdmin(s => ({ ...s, [k]: v }));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f8f9" }}>
      <Header />
      <main style={{ maxWidth: 720, margin: "28px auto", padding: 20 }}>
        <h1>Edit profile</h1>
        {loading && <div style={{ color: "#666" }}>Loading…</div>}
        {!loading && error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}
        {!loading && admin && (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <label>
              <div style={{ fontSize: 13, color: "#666" }}>Name</div>
              <input value={admin.name || ""} onChange={e=>updateField("name", e.target.value)} />
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#666" }}>Employee ID (read-only)</div>
              <input value={admin.emp_id || ""} readOnly />
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#666" }}>Department</div>
              <input value={admin.department || ""} onChange={e=>updateField("department", e.target.value)} />
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#666" }}>District</div>
              <input value={admin.district || ""} onChange={e=>updateField("district", e.target.value)} />
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#666" }}>Phone</div>
              <input value={admin.phone || ""} onChange={e=>updateField("phone", e.target.value.replace(/\D/g,"").slice(0,10))} />
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={saving} style={{ padding: "10px 14px", borderRadius: 8 }}>
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={() => router.push("/admin/profile")} style={{ padding: "10px 14px", borderRadius: 8 }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
