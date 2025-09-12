// app/citizen/complaint/track/[id]/page.jsx
import React from "react";
import Link from "next/link";
import { headers } from "next/headers";

export default async function TrackPage(props) {
  // Next.js 15: params and searchParams are async — await them.
  const params = await props.params;
  const searchParams = await props.searchParams;

  // idParam may be a numeric id or a reference string (UUID). Accept either.
  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const candidate = idParam || (searchParams && (searchParams.id || searchParams.reference)) || "";

  if (!candidate) {
    return (
      <div style={{ padding: 20 }}>
        <p>No complaint id/reference provided.</p>
        <p>Open a link like <code>/citizen/complaint/track/&lt;id-or-reference&gt;</code></p>
      </div>
    );
  }

  // headers() must be awaited before using .get()
  const hdr = await headers();
  const host = hdr.get("host") || `localhost:${process.env.PORT || 3000}`;
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const base = `${protocol}://${host}`;

  // Build API url and encode the param (works for numbers and UUIDs)
  const apiUrl = new URL(`/api/complaints/${encodeURIComponent(candidate)}/track`, base).toString();

  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
      // Try to parse error body for friendly message
      const body = await res.json().catch(() => null);
      return (
        <div style={{ padding: 20 }}>
          <h1>Complaint not found</h1>
          <p>{body?.error ?? `Server returned ${res.status}`}</p>
          <div style={{ marginTop: 12 }}>
            <Link href="/citizen/complaint/file">Register a new complaint</Link>
          </div>
        </div>
      );
    }

    const data = await res.json();
    const complaint = data?.complaint || data;
    const history = data?.history || [];

    if (!complaint) {
      return (
        <div style={{ padding: 20 }}>
          <h1>Complaint not found</h1>
          <p>The server returned no complaint data.</p>
          <div style={{ marginTop: 12 }}>
            <Link href="/citizen/complaint/file">Register a new complaint</Link>
          </div>
        </div>
      );
    }

    return (
      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0 }}>{complaint.title || complaint.reference || `Complaint ${complaint.id}`}</h1>
            <div style={{ color: "#666", marginTop: 6 }}>
              {complaint.department} • {complaint.district} • Pin: {complaint.pincode ?? complaint.zip ?? 'N/A'}
            </div>
            <div style={{ marginTop: 10, color: "#333" }}>{complaint.complaint || complaint.description || ''}</div>
            <div style={{ marginTop: 10, fontSize: 13, color: "#555" }}>
              Reported by: {complaint.name || complaint.reporter_name || complaint.phone || 'Anonymous'} • Created: {new Date(complaint.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        {complaint.photo_path && (
          <div style={{ marginTop: 16 }}>
            {/* show full URL if stored as relative path */}
            <img
              src={complaint.photo_path.startsWith("http") ? complaint.photo_path : `${base}${complaint.photo_path}`}
              alt="complaint photo"
              style={{ maxWidth: "100%", borderRadius: 8 }}
            />
          </div>
        )}

        <section style={{ marginTop: 28 }}>
          <h2 style={{ marginBottom: 8 }}>Status & History</h2>
          {history.length === 0 ? (
            <div style={{ color: "#666" }}>No history available yet.</div>
          ) : (
            <ol style={{ paddingLeft: 16, borderLeft: "2px solid #eee", marginLeft: 0 }}>
              {history.map(h => (
                <li key={h.id} style={{ marginBottom: 12, paddingLeft: 12 }}>
                  <div style={{ fontSize: 13, color: "#444" }}>
                    <strong>{h.status}</strong> {h.note ? `— ${h.note}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#777" }}>{new Date(h.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div style={{ marginTop: 20 }}>
          <Link href="/citizen/complaint/file" style={{ color: "#0366d6" }}>← Register new complaint</Link>
        </div>
      </main>
    );
  } catch (err) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Error loading complaint</h1>
        <pre style={{ color: "crimson" }}>{String(err.message || err)}</pre>
        <div style={{ marginTop: 12 }}>
          <Link href="/citizen/complaint/file">Register a new complaint</Link>
        </div>
      </div>
    );
  }
}
