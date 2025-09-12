// app/citizen/complaint/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FileComplaintPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: "",
    district: "",
    department: "",
    complaint: "",
    photoFile: null,
    photoBase64: null,
    latitude: "",
    longitude: "",
    citizen_id: ""
  });

  const departments = [
    "Sanitation & Waste Management Dept",
    "Electrical Dept / Street Lighting Cell",
    "Water Supply",
    "Roads & Infrastructure",
    "Health",
    "Other"
  ];

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("cc_user") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.phone) setForm(f => ({ ...f, phone: String(parsed.phone), citizen_id: parsed.id ?? "" }));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  // Read file -> base64
  const handleFile = (file) => {
    setError("");
    if (!file) {
      update("photoFile", null);
      update("photoBase64", null);
      return;
    }
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      setError("Image too large. Max 5MB.");
      return;
    }
    update("photoFile", file);

    const reader = new FileReader();
    reader.onload = () => update("photoBase64", reader.result);
    reader.onerror = () => setError("Failed to read image file.");
    reader.readAsDataURL(file);
  };

  const fillLocation = () => {
    if (!navigator?.geolocation) {
      alert("Geolocation not supported by browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        update("latitude", String(pos.coords.latitude));
        update("longitude", String(pos.coords.longitude));
      },
      err => {
        console.warn("geo err", err);
        alert("Unable to get location: " + err.message);
      }
    );
  };

  const validate = () => {
    if (!form.address?.trim()) return "Address is required.";
    if (!/^\d{6}$/.test(String(form.pincode))) return "Pincode must be 6 digits.";
    if (!form.department) return "Please select a department.";
    if (form.phone && !/^\d{10}$/.test(String(form.phone))) return "Phone must be 10 digits.";
    // NEW: enforce photo
    if (!form.photoBase64 && !form.photoFile) return "Photo is required. Please attach a photo.";
    return null;
  };

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMsg("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const body = {
        name: form.name || null,
        phone: form.phone || null,
        address: form.address,
        pincode: form.pincode,
        district: form.district || null,
        department: form.department,
        complaint: form.complaint || null,
        photo_path: form.photoBase64 || null, // server expects base64 here
        photo_name: form.photoFile ? form.photoFile.name : null,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        citizen_id: form.citizen_id || null
      };

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(()=>null);
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Server ${res.status}`);
      }

      setSuccessMsg("Complaint submitted successfully. Reference: " + (data?.reference || data?.id || ""));
      setForm(f => ({ ...f, complaint: "", address: "", district: "", department: "", photoFile: null, photoBase64: null, latitude: "", longitude: "" }));
    } catch (err) {
      console.error("Submit error:", err);
      setError("Submit failed: " + String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { padding: 10, borderRadius: 6, border: "1px solid #ddd", width: "100%" };
  const labelStyle = { display: "block", marginBottom: 6, fontSize: 13, color: "#333" };

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ background: "white", borderRadius: 8, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <h1 style={{ marginTop: 0 }}>File a Complaint</h1>

        {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}
        {successMsg && <div style={{ color: "green", marginBottom: 10 }}>{successMsg}</div>}

        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Name (optional)</label>
              <input value={form.name} onChange={e => update("name", e.target.value)} style={inputStyle} />
            </div>

            <div style={{ width: 220 }}>
              <label style={labelStyle}>Phone (optional)</label>
              <input
                value={form.phone}
                onChange={e => update("phone", e.target.value.replace(/\D/g, "").slice(0,10))}
                style={inputStyle}
                placeholder="10 digits"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Address (required)</label>
            <input value={form.address} onChange={e => update("address", e.target.value)} style={inputStyle} required />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 160 }}>
              <label style={labelStyle}>Pincode</label>
              <input value={form.pincode} onChange={e => update("pincode", e.target.value.replace(/\D/g, "").slice(0,6))} style={inputStyle} required />
            </div>

            <div style={{ flex: 1 }}>
              <label style={labelStyle}>District</label>
              <input value={form.district} onChange={e => update("district", e.target.value)} style={inputStyle} />
            </div>

            <div style={{ width: 320 }}>
              <label style={labelStyle}>Department</label>
              <select value={form.department} onChange={e => update("department", e.target.value)} style={inputStyle} required>
                <option value="">-- Select Department --</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Describe the problem</label>
            <textarea rows={6} value={form.complaint} onChange={e => update("complaint", e.target.value)} style={{ padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ display: "inline-block", padding: 8, borderRadius: 6, background: "#f3f4f6", cursor: "pointer" }}>
              Choose photo (required)
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFile(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
            </label>
            {form.photoFile && <div style={{ fontSize: 13 }}>{form.photoFile.name} ({Math.round(form.photoFile.size/1024)} KB)</div>}
            <button type="button" onClick={fillLocation} style={{ marginLeft: "auto", padding: "8px 12px", borderRadius: 6, background: "#2563eb", color: "white", border: "none" }}>
              Use my location
            </button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <input placeholder="Latitude" value={form.latitude} onChange={e => update("latitude", e.target.value)} style={{ padding: 10, borderRadius: 6, border: "1px solid #ddd", width: 200 }} />
            <input placeholder="Longitude" value={form.longitude} onChange={e => update("longitude", e.target.value)} style={{ padding: 10, borderRadius: 6, border: "1px solid #ddd", width: 200 }} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: 14, borderRadius: 8, background: "#2ecc71", color: "white", border: "none", fontSize: 18 }}>
              {loading ? "Submitting…" : "Submit Complaint"}
            </button>

            <button type="button" onClick={() => {
              setForm(f => ({ ...f, name: "", address: "", pincode: "", district: "", department: "", complaint: "", photoFile: null, photoBase64: null, latitude: "", longitude: "" }));
              setError(""); setSuccessMsg("");
            }} style={{ padding: 14, borderRadius: 8, background: "#f3f4f6", border: "1px solid #ddd" }}>
              Reset
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
