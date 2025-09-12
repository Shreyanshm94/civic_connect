// app/admin/create/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import Header from "../../../components/Header";

export default function AdminCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", emp_id: "", department: "", district: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k,v) => setForm(s=>({...s,[k]:v}));

  async function submit(e){
    e.preventDefault();
    setErr("");
    if (!form.name || !form.emp_id || !form.phone || !form.password) {
      setErr("Missing fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(()=>null);
      if (!res.ok) throw new Error(data?.error || `Server ${res.status}`);
      router.push("/admin/dashboard");
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f8f9" }}>
      <Header />
      <main style={{ maxWidth: 720, margin: "28px auto", padding: 20 }}>
        <h1>Create Admin</h1>
        {err && <div style={{ color: "crimson" }}>{err}</div>}
        <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <input placeholder="Name" value={form.name} onChange={e=>update("name", e.target.value)} />
          <input placeholder="Employee ID" value={form.emp_id} onChange={e=>update("emp_id", e.target.value)} />
          <input placeholder="Department" value={form.department} onChange={e=>update("department", e.target.value)} />
          <input placeholder="District" value={form.district} onChange={e=>update("district", e.target.value)} />
          <input placeholder="Phone" value={form.phone} onChange={e=>update("phone", e.target.value.replace(/\D/g,"").slice(0,10))} />
          <input placeholder="Password" type="password" value={form.password} onChange={e=>update("password", e.target.value)} />
          <button disabled={loading} type="submit">
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </main>
    </div>
  );
}
