"use client";


import Header from "../../components/Header";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CitizenSignup() {
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!/^\d{10}$/.test(form.phone)) {
      setErr("Phone must be 10 digits");
      return;
    }
    if (!form.password || form.password.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }

    const res = await fetch("/api/citizen/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Signup failed");
      return;
    }
    router.push(`/citizen/verify?phone=${encodeURIComponent(form.phone)}`);
  };

  return (
    <>
      <Header />
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-gray-100 p-6">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 w-80">
          <h2 className="text-xl mb-4 font-bold text-green-600 text-center">Citizen Signup</h2>
          {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
          <input className="border p-2 mb-3 w-full rounded text-black bg-white" placeholder="Name" required onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border p-2 mb-3 w-full rounded text-black bg-white" placeholder="Phone (10 digits)" inputMode="numeric" maxLength={10} required onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input type="password" className="border p-2 mb-1 w-full rounded text-black bg-white" placeholder="Password (min 8 chars)" minLength={8} required onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button type="submit" className="mt-3 bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700">Continue</button>
        </form>
      </div>
    </>
  );
}
