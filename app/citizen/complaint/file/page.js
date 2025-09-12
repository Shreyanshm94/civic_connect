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

  const DISTRICTS = [
    "Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa",
    "Giridih","Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma",
    "Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahebganj",
    "Seraikela Kharsawan","Simdega","West Singhbhum"
  ];

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
        setForm(f => ({
          ...f,
          phone: parsed?.phone ? String(parsed.phone) : "",
          citizen_id: parsed?.id ?? "",
          district: f?.district || DISTRICTS[0]
        }));
      } else {
        setForm(f => ({ ...f, district: f?.district || DISTRICTS[0] }));
      }
    } catch (e) {
      setForm(f => ({ ...f, district: f?.district || DISTRICTS[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

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
    if (!form.district) return "Please select a district.";
    if (form.phone && !/^\d{10}$/.test(String(form.phone))) return "Phone must be 10 digits.";
    if (!form.photoBase64 && !form.photoFile) return "Photo is required. Please capture a photo.";
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
        phone: form.phone || null,
        address: form.address,
        pincode: form.pincode,
        district: form.district || null,
        department: form.department,
        complaint: form.complaint || null,
        photo_path: form.photoBase64 || null,
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
      setForm(f => ({
        ...f,
        address: "",
        pincode: "",
        department: "",
        complaint: "",
        photoFile: null,
        photoBase64: null,
        latitude: "",
        longitude: ""
      }));
    } catch (err) {
      console.error("Submit error:", err);
      setError("Submit failed: " + String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cc-main">
      <div className="cc-card">
        <h1 className="cc-title">File a Complaint</h1>

        {error && <div className="cc-error">{error}</div>}
        {successMsg && <div className="cc-success">{successMsg}</div>}

        <form onSubmit={submit} className="cc-form">
          <div className="cc-row phone-row">
            <label className="cc-label">Phone (optional)</label>
            <input
              className="cc-input"
              value={form.phone}
              onChange={e => update("phone", e.target.value.replace(/\D/g, "").slice(0,10))}
              placeholder="10 digits"
              inputMode="numeric"
            />
          </div>

          <div className="cc-row">
            <label className="cc-label">Address (required)</label>
            <input className="cc-input" value={form.address} onChange={e => update("address", e.target.value)} />
          </div>

          <div className="cc-row grid-row">
            <div className="cc-col small">
              <label className="cc-label">Pincode</label>
              <input className="cc-input" value={form.pincode} onChange={e => update("pincode", e.target.value.replace(/\D/g, "").slice(0,6))} inputMode="numeric" />
            </div>

            <div className="cc-col medium">
              <label className="cc-label">District</label>
              <select className="cc-input" value={form.district} onChange={e => update("district", e.target.value)}>
                <option value="">-- Select District --</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="cc-col medium">
              <label className="cc-label">Department</label>
              <select className="cc-input" value={form.department} onChange={e => update("department", e.target.value)}>
                <option value="">-- Select Department --</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="cc-row">
            <label className="cc-label">Describe the problem</label>
            <textarea className="cc-textarea" rows={6} value={form.complaint} onChange={e => update("complaint", e.target.value)} />
          </div>

          <div className="cc-row photo-row">
            <label className="cc-label">Capture photo (required)</label>

            <div className="photo-controls">
              <label className="photo-button" aria-hidden>
                Capture photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={e => handleFile(e.target.files?.[0] ?? null)}
                />
              </label>

              {form.photoBase64 ? (
                <div className="photo-preview">
                  <img src={form.photoBase64} alt="preview" />
                </div>
              ) : (
                <div className="photo-empty">No photo selected</div>
              )}

              <button type="button" className="location-button" onClick={fillLocation}>
                Use my location
              </button>
            </div>
          </div>

          <div className="cc-row coords-row">
            <input className="cc-input small-input" placeholder="Latitude" value={form.latitude} onChange={e => update("latitude", e.target.value)} />
            <input className="cc-input small-input" placeholder="Longitude" value={form.longitude} onChange={e => update("longitude", e.target.value)} />
          </div>

          <div className="cc-row actions-row">
            <button className="submit-button" type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit Complaint"}
            </button>
            <button type="button" className="reset-button" onClick={() => {
              setForm(f => ({ ...f, address: "", pincode: "", department: "", complaint: "", photoFile: null, photoBase64: null, latitude: "", longitude: "" }));
              setError(""); setSuccessMsg("");
            }}>
              Reset
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .cc-main { padding: 18px; display: flex; justify-content: center; }
        .cc-card { width: 100%; max-width: 920px; background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 6px 22px rgba(0,0,0,0.06); }
        .cc-title { margin: 0 0 10px 0; font-size: 22px; }
        .cc-error { color: #b91c1c; margin-bottom: 10px; }
        .cc-success { color: #166534; margin-bottom: 10px; }
        .cc-form { display: grid; gap: 12px; }
        .cc-row { display: flex; flex-direction: column; gap: 6px; }
        .phone-row { max-width: 320px; }
        .label { font-size: 13px; color: #333; }
        .cc-label { font-size: 13px; color: #333; }
        .cc-input { padding: 10px 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 15px; width: 100%; box-sizing: border-box; }
        .cc-textarea { padding: 10px 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 15px; }
        .grid-row { display: grid; grid-template-columns: 160px 1fr 1fr; gap: 12px; align-items: start; }
        .cc-col.small { width: 160px; }
        .cc-col.medium { width: auto; }
        .photo-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .photo-button { display: inline-flex; align-items: center; justify-content: center; padding: 10px 14px; border-radius: 8px; background: #f3f4f6; cursor: pointer; border: 1px solid #ddd; font-size: 15px; }
        .photo-button input { display: none; }
        .photo-preview img { width: 120px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #eee; }
        .photo-empty { color: #666; font-size: 13px; }
        .location-button { padding: 8px 12px; border-radius: 8px; background: #2563eb; color: #fff; border: none; cursor: pointer; }
        .coords-row { display: flex; gap: 10px; }
        .small-input { width: 200px; }
        .actions-row { display: flex; gap: 12px; align-items: center; margin-top: 6px; }
        .submit-button { flex: 1; padding: 12px; border-radius: 10px; background: #16a34a; color: white; border: none; font-size: 16px; cursor: pointer; }
        .reset-button { padding: 12px 16px; border-radius: 10px; background: #f3f4f6; border: 1px solid #ddd; cursor: pointer; }

        /* MOBILE: stack everything, larger controls */
        @media (max-width: 640px) {
          .cc-card { padding: 16px; border-radius: 12px; }
          .cc-title { font-size: 20px; }
          .grid-row { grid-template-columns: 1fr; }
          .phone-row { max-width: 100%; }
          .photo-preview img { width: 100%; max-width: 320px; height: auto; }
          .coords-row { flex-direction: column; }
          .small-input { width: 100%; }
          .actions-row { flex-direction: column-reverse; }
          .submit-button, .reset-button, .location-button, .photo-button {
            width: 100%;
            padding: 14px;
            font-size: 16px;
          }
          .photo-controls { flex-direction: column; align-items: stretch; }
          .photo-empty { text-align: left; }
        }

        /* slightly larger for small tablets */
        @media (min-width: 641px) and (max-width: 900px) {
          .grid-row { grid-template-columns: 140px 1fr; grid-auto-flow: row; }
          .cc-col.medium { width: 100%; }
        }
      `}</style>
    </main>
  );
}
