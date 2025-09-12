"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!empId || !password) { setErr("Enter emp_id and password"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emp_id: empId, password })
      });
      const data = await res.json().catch(()=>null);
      if (!res.ok) throw new Error(data?.error || `Server ${res.status}`);

      if (data?.admin) {
        localStorage.setItem("admin_user", JSON.stringify(data.admin));
        router.push("/admin/dashboard");
      } else {
        setErr("Login failed");
      }
    } catch (err) {
      setErr(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 440, margin: "0 auto" }}>
      <h1>Admin Login</h1>
      {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Employee ID (emp_id)"
          value={empId}
          onChange={e => setEmpId(e.target.value.trim())}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
