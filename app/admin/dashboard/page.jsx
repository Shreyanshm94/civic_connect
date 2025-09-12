"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../components/Header";

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [topComplaints, setTopComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintsError, setComplaintsError] = useState(null);

  useEffect(() => {
    try {
      const a = localStorage.getItem("admin_user");
      if (a) setAdmin(JSON.parse(a));
    } catch (e) {
      console.warn("Failed to parse admin_user", e);
    }
  }, []);

  useEffect(() => {
    // fetch complaints and compute top by upvotes
    let mounted = true;
    async function load() {
      setLoadingComplaints(true);
      setComplaintsError(null);
      try {
        // <-- changed to the new top endpoint
        const res = await fetch("/api/complaints/top");
        if (!res.ok) throw new Error(`Server ${res.status}`);
        const data = await res.json();
        if (!mounted) return;

        console.log("[AdminDashboard] /api/complaints/top =>", data);

        // Expecting array of complaints with at least: id, reference, complaint, upvotes, status
        const arr = Array.isArray(data) ? data : (data?.complaints || []);
        // sort by upvotes desc, then by created_at desc as tiebreaker
        arr.sort((a, b) => {
          const ua = Number(a.upvotes || 0);
          const ub = Number(b.upvotes || 0);
          if (ub !== ua) return ub - ua;
          const da = new Date(a.created_at || 0).getTime();
          const db = new Date(b.created_at || 0).getTime();
          return db - da;
        });

        // pick top 5 with upvotes > 0, otherwise show top 5 anyway
        const filtered = arr.filter(c => Number(c.upvotes || 0) > 0);
        setTopComplaints((filtered.length ? filtered : arr).slice(0, 5));
      } catch (err) {
        console.error("[AdminDashboard] fetch complaints error:", err);
        setComplaintsError(String(err));
      } finally {
        if (mounted) setLoadingComplaints(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  function handleLogout() {
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  }

  // Small presentational components
  const Card = ({ children, style }) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
        padding: 18,
        marginBottom: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );

  const Action = ({ onClick, children, icon }) => (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "12px 14px",
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,0.06)",
        background: "linear-gradient(180deg, #fff, #fbfbfb)",
        cursor: "pointer",
        fontSize: 15,
        textAlign: "left",
      }}
      aria-label={typeof children === "string" ? children : "action"}
    >
      <span style={{ fontSize: 18, opacity: 0.85 }}>{icon}</span>
      <span>{children}</span>
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f6f8f9" }}>
      <Header />

      <main style={{ maxWidth: 1100, margin: "28px auto", padding: "0 20px" }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Left column - actions + high priority complaints */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    Welcome{admin ? `, ${admin.name.split(" ")[0]}` : ""}
                  </div>
                  <div style={{ color: "#666", marginTop: 6 }}>Admin quick actions</div>
                </div>

                <div>
                  <button
                    onClick={handleLogout}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#333",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                <Action
                  onClick={() => router.push("/admin/complaints")}
                  icon={"🗂"}
                >
                  View complaints
                </Action>

                <Action
                  onClick={() => router.push("/admin/profile")}
                  icon={"👤"}
                >
                  Profile
                </Action>

                <Action
                  onClick={() => router.push("/admin/create")}
                  icon={"➕"}
                >
                  Create admin / add colleague
                </Action>
              </div>
            </Card>

            {/* High Priority Complaints card */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>High Priority Complaints</div>
                <div style={{ color: "#666", fontSize: 13 }}>{loadingComplaints ? "Loading..." : `${topComplaints.length} shown`}</div>
              </div>

              {loadingComplaints && (
                <div style={{ color: "#666" }}>Fetching top complaints…</div>
              )}

              {!loadingComplaints && complaintsError && (
                <div style={{ color: "crimson" }}>Failed to load: {complaintsError}</div>
              )}

              {!loadingComplaints && !complaintsError && topComplaints.length === 0 && (
                <div style={{ color: "#666" }}>No prioritized complaints yet.</div>
              )}

              {!loadingComplaints && topComplaints.length > 0 && (
                <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                  {topComplaints.map(c => (
                    <button
                      key={c.id}
                      onClick={() => router.push(`/admin/complaints/${c.id}`)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(0,0,0,0.06)",
                        background: "#fff",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      title={c.complaint || c.reference || `Complaint #${c.id}`}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.reference ? `${c.reference} — ` : ""}{(c.complaint || "Untitled complaint").slice(0, 80)}
                        </div>
                        <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                          {c.status || "—"} · {new Date(c.created_at || "").toLocaleDateString() || "—"}
                        </div>
                      </div>

                      <div style={{ marginLeft: 12, textAlign: "right", minWidth: 66 }}>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{Number(c.upvotes || 0)}</div>
                        <div style={{ color: "#999", fontSize: 12 }}>upvotes</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Notifications</div>
              <div style={{ color: "#444" }}>No new notifications — all caught up ✅</div>
            </Card>

            <Card>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 10, background: "#eaf5ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
                }}>📊</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{/* dynamic stat */}0</div>
                  <div style={{ color: "#666" }}>Resolved this month</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#666" }}>SLA Avg</div>
                  <div style={{ fontWeight: 700 }}>—</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#666" }}>Upvotes</div>
                  <div style={{ fontWeight: 700 }}>—</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right column - profile / quick info */}
          <div style={{ width: 360 }}>
            <Card style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 12, background: "#dfeffb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32
                }}>
                  {admin ? admin.name.split(" ").map(n=>n[0]).slice(0,2).join("") : "A"}
                </div>
              </div>

              <div style={{ fontSize: 18, fontWeight: 700 }}>{admin?.name || "Admin"}</div>
              <div style={{ color: "#666", marginTop: 6 }}>{admin?.emp_id ? `Employee ID: ${admin.emp_id}` : ""}</div>

              <div style={{ marginTop: 14, textAlign: "left" }}>
                <div style={{ color: "#666", fontSize: 13 }}>Department</div>
                <div style={{ marginBottom: 10 }}>{admin?.department || "—"}</div>

                <div style={{ color: "#666", fontSize: 13 }}>District</div>
                <div style={{ marginBottom: 10 }}>{admin?.district || "—"}</div>

                <div style={{ color: "#666", fontSize: 13 }}>Phone</div>
                <div>{admin?.phone || "—"}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => router.push("/admin/profile")}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "#fff",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  Edit profile
                </button>
              </div>
            </Card>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>Quick links</div>
                <div style={{ color: "#666" }}>Shortcuts</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={()=>router.push("/admin/complaints?status=Pending")} style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", background: "#fff", cursor: "pointer", textAlign: "left" }}>
                  Pending complaints
                </button>
                <button onClick={()=>router.push("/admin/complaints")} style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", background: "#fff", cursor: "pointer", textAlign: "left" }}>
                  All complaints
                </button>
                <button onClick={()=>router.push("/admin/create")} style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", background: "#fff", cursor: "pointer", textAlign: "left" }}>
                  Add colleague
                </button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
