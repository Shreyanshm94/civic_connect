// app/citizen/complaint/track/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackIndex() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [phone, setPhone] = useState(null);

  // Read logged-in user from localStorage (cc_user should contain { id, name, phone } or at least phone)
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("cc_user") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setPhone(parsed?.phone ?? null);
      }
    } catch (e) {
      console.warn("Failed to read cc_user from localStorage", e);
    }
  }, []);

  // Fetch complaints (server endpoint should return an array)
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/complaints/my", { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Server returned ${res.status}`);
        }
        const data = await res.json();
        if (mounted) setComplaints(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load complaints:", err);
        if (mounted) setError(String(err.message || err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Filter visible complaints for current user (by phone or citizen_id)
  const visible = phone
    ? complaints.filter(c => String(c.phone) === String(phone) || String(c.citizen_id) === String(phone))
    : complaints;

  const goToReference = (refOrId) => {
    if (!refOrId) return;
    // navigate to dynamic track page (works for numeric id or reference string)
    router.push(`/citizen/complaint/track/${encodeURIComponent(refOrId)}`);
  };

  return (
    <main style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Track Your Complaint</h1>

      <div style={{ margin: "12px 0 18px 0" }}>
        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Enter complaint ID or reference</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="paste id or reference here"
            aria-label="complaint id or reference"
            style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />
          <button
            onClick={() => goToReference(query)}
            style={{ padding: "10px 14px", borderRadius: 8, background: "#2563eb", color: "white", border: "none", cursor: "pointer" }}
          >
            Go
          </button>
        </div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Or choose from your recent complaints below.
        </div>
      </div>

      <section>
        <h2 style={{ marginBottom: 10 }}>Your Complaints</h2>

        {loading ? (
          <div>Loading complaints…</div>
        ) : error ? (
          <div style={{ color: "crimson" }}>{error}</div>
        ) : visible.length === 0 ? (
          <div style={{ color: "#666" }}>
            {phone ? "No complaints found for your phone." : "No complaints available. Please file a complaint first."}
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {visible.map(c => (
              <li
                key={c.id}
                style={{
                  padding: 14,
                  border: "1px solid #eee",
                  borderRadius: 10,
                  marginBottom: 12,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{c.department} • {c.district}</div>
                  <div style={{ color: "#444", marginTop: 6 }}>{(c.complaint || "").slice(0, 160) || "(no description)"}</div>
                  <div style={{ color: "#777", fontSize: 12, marginTop: 8 }}>
                    Ref: <strong>{c.reference || c.id}</strong> • Status: {c.status} • {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ minWidth: 120, textAlign: "right" }}>
                  <button
                    onClick={() => goToReference(c.reference || c.id)}
                    style={{ padding: "8px 12px", borderRadius: 8, background: "#0f766e", color: "white", border: "none", cursor: "pointer" }}
                  >
                    Track
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
