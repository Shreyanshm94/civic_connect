// app/admin/complaints/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header"; // fixed relative path

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        // request ONLY pending complaints
        const res = await fetch("/api/complaints?status=Pending");
        if (!res.ok) throw new Error(`Server ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        setComplaints(Array.isArray(json.complaints) ? json.complaints : []);
      } catch (e) {
        setErr(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f6f8f9" }}>
      <Header />
      <main style={{ maxWidth: 1100, margin: "28px auto", padding: 20 }}>
        <h1>Pending Complaints</h1>

        {loading && <div style={{ color: "#666" }}>Loading complaints…</div>}
        {err && <div style={{ color: "crimson" }}>Failed: {err}</div>}

        {!loading && !err && complaints.length === 0 && (
          <div style={{ color: "#666" }}>No pending complaints found.</div>
        )}

        {!loading && complaints.length > 0 && (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {complaints.map(c => (
              <div
                key={c.id}
                style={{
                  background: "#fff",
                  padding: 12,
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.reference ? `${c.reference} — ` : ""}{(c.complaint || "No description").slice(0, 120)}
                  </div>
                  <div style={{ color: "#666", fontSize: 13, marginTop: 6 }}>
                    {c.status || "—"} · {c.district || "—"}
                  </div>
                </div>

                <div style={{ marginLeft: 12, textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>{c.upvotes || 0} ↑</div>
                  <button
                    onClick={() => router.push(`/admin/complaints/${c.id}`)}
                    style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
