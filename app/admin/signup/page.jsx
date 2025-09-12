"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Header from "../../components/Header"; // keep as you already have

const DISTRICTS = [
  "Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih",
  "Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga",
  "Pakur","Palamu","Ramgarh","Ranchi","Sahebganj","Seraikela Kharsawan","Simdega","West Singhbhum"
];

const DEPARTMENTS = [
  "Sanitation & Waste Management Dept",
  "Public Works / Roads Dept",
  "Electrical Dept / Street Lighting Cell",
  "Water Supply & Sewerage Dept",
  "Parks & Horticulture Dept",
  "Traffic & Transport Dept",
  "Municipal Health Dept"
];

export default function AdminSignup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    emp_id: "",
    department: DEPARTMENTS[0],
    district: DISTRICTS[0],
    phone: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(s => ({ ...s, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.emp_id || !form.phone || !form.password) {
      setError("Please fill all required fields.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setError("Phone must be 10 digits.");
      return;
    }

    setLoading(true);
    try {
      // NOTE: changed URL to singular 'admin' to match your route folder
      const res = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.error || `Server ${res.status}`;
        throw new Error(msg);
      }

      // success -> redirect to admin login (adjust path if different)
      router.push("/admin/login");
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 640, margin: "0 auto" }}>
      <Header />
      <h1>Admin Signup</h1>

      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Nodal Officer's Name"
          value={form.name}
          onChange={e => update("name", e.target.value)}
          required
        />
        <input
          placeholder="Employee ID"
          value={form.emp_id}
          onChange={e => update("emp_id", e.target.value)}
          required
        />
        <select value={form.department} onChange={e => update("department", e.target.value)}>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={form.district} onChange={e => update("district", e.target.value)}>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input
          placeholder="Phone (10 digits)"
          value={form.phone}
          onChange={e => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => update("password", e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create admin"}
        </button>
      </form>
    </div>
  );
}
