"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ComplaintsIndex() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState(null);
  const [upvoting, setUpvoting] = useState({});
  const [pincode, setPincode] = useState("");

  // load phone from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cc_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setPhone(parsed?.phone ?? null);
      }
    } catch (e) {
      console.warn("Failed to read cc_user", e);
    }
  }, []);

  // fetch complaints
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/complaints/my", { cache: "no-store", signal: controller.signal });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || `Server ${res.status}`;
          throw new Error(msg);
        }
        if (mounted) {
          setComplaints(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to load complaints:", err);
          if (mounted) setError(String(err.message || err));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; controller.abort(); };
  }, []);

  // phone based filter
  let visible = phone
    ? complaints.filter(c => String(c.phone) === String(phone) || String(c.citizen_id) === String(phone))
    : complaints;

  // 🔹 extra pincode filter
  if (pincode.trim()) {
    visible = visible.filter(c => String(c.pincode).startsWith(pincode.trim()));
  }

  // navigation
  const openComplaint = (refOrId) => {
    if (refOrId) {
      router.push(`/citizen/complaint/track/${encodeURIComponent(refOrId)}`);
    }
  };

  // upvote handler
  const handleUpvote = async (refOrId) => {
    if (!refOrId || upvoting[refOrId]) return;
    setUpvoting(prev => ({ ...prev, [refOrId]: true }));

    try {
      // 🔹 Get citizenId from localStorage
      const raw = localStorage.getItem("cc_user");
      const parsed = raw ? JSON.parse(raw) : null;
      const citizenId = parsed?.id;

      if (!citizenId) {
        alert("Please login to upvote");
        return;
      }

      const res = await fetch(`/api/complaints/${encodeURIComponent(refOrId)}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId })
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        if (body?.error?.includes("already upvoted")) {
          setComplaints(prev => prev.map(c =>
            (c.reference === refOrId || String(c.id) === String(refOrId))
              ? { ...c, alreadyUpvoted: true }
              : c
          ));
        }
        throw new Error(body?.error || `Server ${res.status}`);
      }

      if (body?.upvotes !== undefined) {
        setComplaints(prev => prev.map(c =>
          (c.reference === refOrId || String(c.id) === String(refOrId))
            ? { ...c, upvotes: body.upvotes, alreadyUpvoted: true }
            : c
        ));
      }
    } catch (err) {
      console.error("Upvote failed:", err);
      alert("Upvote failed: " + String(err.message || err));
    } finally {
      setUpvoting(prev => ({ ...prev, [refOrId]: false }));
    }
  };

  return (
    <main style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <h1>Problems Registered</h1>

      {/* 🔹 Pincode filter */}
      <div style={{ margin: "10px 0" }}>
        <input
          type="text"
          placeholder="Filter by Pincode"
          value={pincode}
          onChange={e => setPincode(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            width: "100%",
            maxWidth: 300
          }}
        />
      </div>

      {loading ? (
        <div>Loading …</div>
      ) : error ? (
        <div style={{ color: "crimson" }}>{error}</div>
      ) : visible.length === 0 ? (
        <div style={{ color: "#666" }}>
          {phone ? "You have not registered any complaints yet." : "No complaints available."}
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {visible.map(c => (
            <li key={c.id || c.reference} style={{ padding: 12, border: "1px solid #eee", borderRadius: 8, marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>{c.department} • {c.district}</div>
              <div style={{ color: "#444", marginTop: 6 }}>{(c.complaint || "").slice(0, 160) || "(no description)"}</div>
              <div style={{ color: "#777", marginTop: 6, fontSize: 12 }}>
                Ref: <strong>{c.reference || c.id}</strong> • Status: {c.status} • {new Date(c.created_at).toLocaleString()}
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#333" }}>
                👍 Upvotes: <strong>{c.upvotes || 0}</strong>
              </div>

              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button
                  onClick={() => openComplaint(c.reference || c.id)}
                  style={{ padding: "8px 12px", borderRadius: 8, background: "#2563eb", color: "white", border: "none", cursor: "pointer" }}
                >
                  View / Track
                </button>
                <button
                  onClick={() => handleUpvote(c.reference || c.id)}
                  disabled={!!upvoting[c.reference || c.id] || c.alreadyUpvoted}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: c.alreadyUpvoted ? "#9ca3af" : "#10b981",
                    color: "white",
                    border: "none",
                    cursor: c.alreadyUpvoted ? "not-allowed" : "pointer"
                  }}
                >
                  {c.alreadyUpvoted ? "Upvoted" : (upvoting[c.reference || c.id] ? "Upvoting…" : "Upvote")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
