// app/admin/complaints/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "../../../components/Header";

export default function AdminComplaintDetailPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [id, setId] = useState(null);
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [changingStatus, setChangingStatus] = useState(false);

  // extract numeric id from the pathname (e.g. /admin/complaints/4)
  useEffect(() => {
    if (!pathname) return;
    const parts = pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    const numeric = Number(last);
    if (numeric && !isNaN(numeric)) {
      setId(numeric);
    } else {
      setErr("Invalid complaint id in URL");
      setLoading(false);
    }
  }, [pathname]);

  // fetch complaint by id
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/complaints/${id}`);
        console.log("[ComplaintDetail] fetch /api/complaints/:id status", res.status);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Complaint not found");
          throw new Error(`Server ${res.status}`);
        }
        const json = await res.json().catch(()=>null);
        if (!mounted) return;
        if (!json?.ok) throw new Error(json?.error || "Invalid response");
        setComplaint(json.complaint);
      } catch (e) {
        console.error("[ComplaintDetail] load error:", e);
        setErr(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  // helper to build image src from photo_path
  function photoSrc(photoPath) {
    if (!photoPath) return null;
    if (photoPath.startsWith("http://") || photoPath.startsWith("https://") || photoPath.startsWith("/")) {
      return photoPath;
    }
    // if your uploads are stored under /uploads/...
    return `/uploads/${photoPath}`;
  }

  async function updateStatus(newStatus) {
    if (!id) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (!token) {
      alert("You must be signed in as an admin to change status.");
      return;
    }
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/admin/complaints/${id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized (token invalid or expired)");
        throw new Error(`Server ${res.status}`);
      }
      const json = await res.json().catch(()=>null);
      if (!json?.ok) throw new Error(json?.error || "Failed to update status");

      // optimistic update
      setComplaint(prev => prev ? ({ ...prev, status: newStatus }) : prev);
    } catch (e) {
      console.error("updateStatus error:", e);
      alert("Failed to update status: " + String(e));
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f8f9" }}>
      <Header />
      <main style={{ maxWidth: 980, margin: "28px auto", padding: 20 }}>
        <button onClick={() => router.back()} style={{ marginBottom: 12 }}>← Back</button>

        {loading && <div style={{ color: "#666" }}>Loading complaint…</div>}
        {!loading && err && <div style={{ color: "crimson" }}>Failed to load: {String(err)}</div>}

        {!loading && !err && !complaint && (
          <div style={{ color: "#666" }}>No complaint data.</div>
        )}

        {!loading && complaint && (
          <div style={{ background: "#fff", padding: 18, borderRadius: 10, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0 }}>
                  {complaint.reference ? complaint.reference : `Complaint #${complaint.id}`}
                </h2>
                <div style={{ color: "#666", marginTop: 6 }}>
                  {complaint.department || "—"} · {complaint.district || "—"}
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Description</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{complaint.complaint || "No description provided."}</div>
                </div>

                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                  <div>
                    <div style={{ color: "#666", fontSize: 13 }}>Address</div>
                    <div>{complaint.address || "—"}</div>
                  </div>

                  <div>
                    <div style={{ color: "#666", fontSize: 13 }}>Pincode</div>
                    <div>{complaint.pincode || "—"}</div>
                  </div>

                  <div>
                    <div style={{ color: "#666", fontSize: 13 }}>Citizen</div>
                    <div>{complaint.name || "—"}</div>
                  </div>

                  <div>
                    <div style={{ color: "#666", fontSize: 13 }}>Phone</div>
                    <div>{complaint.phone || "—"}</div>
                  </div>

                  <div>
                    <div style={{ color: "#666", fontSize: 13 }}>Upvotes</div>
                    <div style={{ fontWeight: 700 }}>{Number(complaint.upvotes || 0)}</div>
                  </div>

                  <div>
                    <div style={{ color: "#666", fontSize: 13 }}>Status</div>
                    <div style={{ fontWeight: 700 }}>{complaint.status || "—"}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ color: "#666", fontSize: 13 }}>Created</div>
                  <div>{complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "—"}</div>
                </div>
              </div>

              <aside style={{ width: 320 }}>
                {complaint.photo_path ? (
                  <img
                    src={photoSrc(complaint.photo_path)}
                    alt="Complaint photo"
                    style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: 8 }}
                  />
                ) : (
                  <div style={{ width: "100%", height: 260, borderRadius: 8, background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
                    No photo
                  </div>
                )}

                <div style={{ marginTop: 12, display: "flex", gap: 8, flexDirection: "column" }}>
                  <button
                    onClick={() => updateStatus("In Progress")}
                    disabled={changingStatus}
                    style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer" }}
                  >
                    {changingStatus ? "Updating…" : "Mark In Progress"}
                  </button>

                  <button
                    onClick={() => updateStatus("Resolved")}
                    disabled={changingStatus}
                    style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer" }}
                  >
                    {changingStatus ? "Updating…" : "Mark Resolved"}
                  </button>

                  <button
                    onClick={async () => {
                      // quick upvote helper (client-only, for admin testing)
                      try {
                        const res = await fetch(`/api/complaints/${id}/upvote`, { method: "POST" });
                        if (!res.ok) throw new Error(`Server ${res.status}`);
                        // optimistic UI
                        setComplaint(prev => prev ? ({ ...prev, upvotes: Number(prev.upvotes || 0) + 1 }) : prev);
                      } catch (e) {
                        console.error("upvote failed", e);
                        alert("Upvote failed: " + String(e));
                      }
                    }}
                    style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: "#fff", border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    Upvote (test)
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
