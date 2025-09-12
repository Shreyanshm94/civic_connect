// app/citizen/complaint/track/[[id]]/page.jsx
import React from "react";
import Link from "next/link";
import { headers } from "next/headers";

export default async function TrackIndexOrDetail({ params, searchParams }) {
  // await params
  const resolvedParams = await params;
  const idFromParams = resolvedParams?.id;
  const idParam = (idFromParams || searchParams?.id || "")?.toString();

  // ----- await headers() before using it -----
  const hdr = await headers();
  const host = hdr.get("host") || `localhost:${process.env.PORT || 3000}`;
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const base = `${protocol}://${host}`;

  if (!idParam) {
    const listApiUrl = new URL(`/api/complaints/my`, base).toString();
    let list;
    try {
      const res = await fetch(listApiUrl, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        return (
          <div style={{ padding: 20 }}>
            <h1>Error</h1>
            <p>{body?.error ?? `Status ${res.status}`}</p>
          </div>
        );
      }
      list = await res.json();
    } catch (err) {
      return (
        <div style={{ padding: 20 }}>
          <h1>Error</h1>
          <pre>{String(err.message)}</pre>
        </div>
      );
    }

    return (
      <main style={{ padding: 20 }}>
        <h1>Your Registered Complaints</h1>
        {(!list || list.length === 0) ? (
          <div>
            No complaints yet.{" "}
            <Link href="/citizen/complaint/register">Register one</Link>
          </div>
        ) : (
          <ul>
            {list.map((c) => (
              <li key={c.id} style={{ marginBottom: 10 }}>
                <Link href={`/citizen/complaint/track/${c.id}`}>
                  <strong>{c.title || c.reference}</strong>
                </Link>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  // detail view
  const apiUrl = new URL(`/api/complaints/${encodeURIComponent(idParam)}/track`, base).toString();

  let data;
  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return (
        <div style={{ padding: 20 }}>
            <h1>Error</h1>
            <p>{body?.error ?? `Status ${res.status}`}</p>
        </div>
      );
    }
    data = await res.json();
  } catch (err) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Error</h1>
        <pre>{String(err.message)}</pre>
      </div>
    );
  }

  const complaint = data?.complaint;
  const history = data?.history || [];

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>{complaint.title || complaint.reference}</h1>
      <div>{complaint.description}</div>
      <div style={{ marginTop: 12 }}>
        <strong>Reported by:</strong> {complaint.reporter_name} •{" "}
        {new Date(complaint.created_at).toLocaleString()}
      </div>

      <section style={{ marginTop: 16 }}>
        <h2>Status & History</h2>
        {history.length === 0 ? (
          <div>No history yet.</div>
        ) : (
          <ol>
            {history.map((h) => (
              <li key={h.id} style={{ marginBottom: 8 }}>
                <strong>{h.status}</strong> {h.note ? `— ${h.note}` : ""}
                <div style={{ fontSize: 12, color: "#666" }}>{new Date(h.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div style={{ marginTop: 16 }}>
        <Link href="/citizen/complaint/track">← Back to my complaints</Link>
      </div>
    </main>
  );
}
